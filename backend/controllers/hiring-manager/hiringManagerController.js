const Candidate = require('../../models/Candidate');
const ApprovalRequest = require('../../models/ApprovalRequest');
const HiringRecommendation = require('../../models/hiring-manager/HiringRecommendation');

const userIdOf = (req) => req.user?._id || req.user?.id;
const idString = (value) => value == null ? '' : String(value);

function assignedToManagerQuery(req) {
  const uid = userIdOf(req);
  return {
    isArchived: { $ne: true },
    hiringManagerId: uid
  };
}

function stripSensitive(candidate) {
  if (!candidate) return candidate;
  const obj = typeof candidate.toObject === 'function' ? candidate.toObject() : { ...candidate };
  delete obj.salary;
  delete obj.ctc;
  delete obj.offer;
  delete obj.offerDetails;
  delete obj.salaryDetails;
  if (Array.isArray(obj.interviews)) {
    obj.interviews = obj.interviews.map((round) => {
      const item = { ...round };
      delete item.salary;
      delete item.offer;
      delete item.offerDetails;
      return item;
    });
  }
  return obj;
}

function isCurrentApproverForManager(step, uid) {
  if (!step || step.status !== 'pending') return false;
  if (idString(step.approverId) === idString(uid)) return true;
  if (!step.approverId && (step.approverRole === 'hiring_manager' || step.approverRole === 'hm')) return true;
  return false;
}

exports.getDashboard = async (req, res, next) => {
  try {
    const query = assignedToManagerQuery(req);
    const [openRoles, candidateCount, interviewsThisWeek, pendingApprovals] = await Promise.all([
      Candidate.distinct('position', { ...query, status: { $nin: ['selected', 'rejected'] } }),
      Candidate.countDocuments(query),
      Candidate.countDocuments({
        ...query,
        interviews: {
          $elemMatch: {
            scheduledAt: {
              $gte: startOfWeek(),
              $lt: endOfWeek()
            }
          }
        }
      }),
      ApprovalRequest.find({ status: 'pending' }).select('steps currentStep').lean()
    ]);
    const approvalsToApprove = pendingApprovals.filter(approval => {
      const step = currentApprovalStep(approval);
      return isCurrentApproverForManager(step, userIdOf(req));
    }).length;
    return res.json({
      success: true,
      data: { openRoles: openRoles.length, pipelineCandidates: candidateCount,
        interviewsThisWeek, offersToApprove: approvalsToApprove }
    });
  } catch (err) { next(err); }
};

function startOfWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}
function endOfWeek() {
  const d = startOfWeek();
  d.setDate(d.getDate() + 7);
  return d;
}

exports.getRoles = async (req, res, next) => {
  try {
    const rows = await Candidate.aggregate([
      { $match: assignedToManagerQuery(req) },
      { $group: {
        _id: '$position',
        department: { $first: '$department' },
        candidateCount: { $sum: 1 },
        openCandidateCount: {
          $sum: { $cond: [{ $in: ['$status', ['selected', 'rejected']] }, 0, 1] }
        }
      }},
      { $sort: { _id: 1 } }
    ]);
    return res.json({ success: true, data: rows.map(r => ({
      role: r._id, department: r.department,
      candidateCount: r.candidateCount, openCandidateCount: r.openCandidateCount
    })) });
  } catch (err) { next(err); }
};

exports.listCandidates = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const filter = assignedToManagerQuery(req);
    if (req.query.status) filter.status = req.query.status;
    if (req.query.position) filter.position = new RegExp(escapeRegex(req.query.position), 'i');
    const [rows, total] = await Promise.all([
      Candidate.find(filter)
        .select('-salary -ctc -offer -offerDetails -salaryDetails')
        .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Candidate.countDocuments(filter)
    ]);
    return res.json({
      success: true,
      data: rows.map(stripSensitive),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) { next(err); }
};

exports.getCandidate = async (req, res, next) => {
  try {
    const candidate = await Candidate.findOne({
      _id: req.params.id,
      ...assignedToManagerQuery(req)
    })
      .select('-salary -ctc -offer -offerDetails -salaryDetails')
      .populate({ path: 'interviews.interviewerId', select: 'name email' });
    if (!candidate) {
      return res.status(404).json({ success: false,
        error: { code: 'NOT_FOUND', message: 'Candidate not found or not assigned to you' } });
    }
    const latestRecommendations = await HiringRecommendation.find({ candidateId: candidate._id })
      .populate('hiringManagerId', 'name').sort({ createdAt: -1 }).limit(20).lean();
    return res.json({ success: true, data: {
      ...stripSensitive(candidate),
      recommendations: latestRecommendations
    }});
  } catch (err) { next(err); }
};

exports.recommendCandidate = async (req, res, next) => {
  try {
    const decision = String(req.body.decision || '').toLowerCase();
    const comments = String(req.body.comments || '').trim();
    if (!['select', 'reject'].includes(decision) || !comments) {
      return res.status(400).json({ success: false, error: {
        code: 'VALIDATION_ERROR', message: 'decision must be select or reject and comments are required'
      }});
    }
    const candidate = await Candidate.findOne({
      _id: req.params.id, ...assignedToManagerQuery(req)
    });
    if (!candidate) {
      return res.status(404).json({ success: false, error: {
        code: 'NOT_FOUND', message: 'Candidate not found or not assigned to you'
      }});
    }
    const recommendation = await HiringRecommendation.create({
      candidateId: candidate._id,
      hiringManagerId: userIdOf(req),
      decision,
      comments
    });

    candidate.hiringRecommendation = {
      status: decision,
      comments,
      recommendedAt: new Date(),
      recommendedBy: userIdOf(req),
    };
    if (decision === 'select') {
      candidate.status = 'selected';
    } else if (decision === 'reject') {
      candidate.status = 'rejected';
    }
    await candidate.save();

    return res.status(201).json({ success: true, data: recommendation,
      message: 'Hiring recommendation submitted' });
  } catch (err) { next(err); }
};

exports.listApprovals = async (req, res, next) => {
  try {
    const uid = userIdOf(req);
    const approvals = await ApprovalRequest.find({ status: 'pending' })
      .sort({ createdAt: -1 }).lean();
    const filtered = approvals.filter(a => {
      const step = currentApprovalStep(a);
      return isCurrentApproverForManager(step, uid);
    });
    return res.json({ success: true, data: filtered });
  } catch (err) { next(err); }
};

exports.getApproval = async (req, res, next) => {
  try {
    const approval = await ApprovalRequest.findById(req.params.id).lean();
    if (!approval) return res.status(404).json({ success: false,
      error: { code: 'NOT_FOUND', message: 'Approval request not found' } });
    const uid = idString(userIdOf(req));
    const step = currentApprovalStep(approval);
    const assigned = isCurrentApproverForManager(step, uid);
    if (!assigned) return res.status(403).json({ success: false, error: {
      code: 'FORBIDDEN', message: 'This approval is not assigned to you'
    }});
    return res.json({ success: true, data: approval });
  } catch (err) { next(err); }
};

async function decideApproval(req, res, next, decision) {
  try {
    const approval = await ApprovalRequest.findById(req.params.id);
    if (!approval) return res.status(404).json({ success: false, error: {
      code: 'NOT_FOUND', message: 'Approval request not found'
    }});
    const uid = idString(userIdOf(req));
    const step = currentApprovalStep(approval);
    if (!isCurrentApproverForManager(step, uid) || approval.status !== 'pending') {
      return res.status(403).json({ success: false, error: {
        code: 'FORBIDDEN', message: 'You are not the current approver for this request'
      }});
    }
    if (decision === 'reject' && !String(req.body.comment || '').trim()) {
      return res.status(400).json({ success: false, error: {
        code: 'VALIDATION_ERROR', message: 'A rejection comment is required'
      }});
    }
    step.status = decision === 'approve' ? 'approved' : 'rejected';
    step.comment = String(req.body.comment || '').trim();
    step.approverId = step.approverId || uid;
    step.actedAt = new Date();
    if (decision === 'reject') {
      approval.status = 'rejected';
    } else {
      const nextStep = approval.steps
        .filter(candidateStep => candidateStep.order > step.order)
        .sort((a, b) => a.order - b.order)[0];
      if (nextStep) approval.currentStep = nextStep.order;
      else approval.status = 'approved';
    }
    await approval.save();
    return res.json({ success: true, data: approval,
      message: decision === 'approve' ? 'Approval recorded' : 'Approval rejected' });
  } catch (err) { next(err); }
}
exports.approveRequest = (req, res, next) => decideApproval(req, res, next, 'approve');
exports.rejectRequest = (req, res, next) => decideApproval(req, res, next, 'reject');

function currentApprovalStep(approval) {
  return approval.steps?.find(step => step.order === approval.currentStep) ||
    approval.steps?.[approval.currentStep] ||
    null;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
