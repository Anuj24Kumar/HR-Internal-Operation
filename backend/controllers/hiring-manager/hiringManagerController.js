const Candidate = require('../../models/Candidate');
const User = require('../../models/User');
const Application = require('../../models/Application');
const HiringRecommendation = require('../../models/hiring-manager/HiringRecommendation');

const userIdOf = (req) => req.user?._id || req.user?.id;

function assignedToManagerQuery(req) {
  const uid = userIdOf(req);
  return {
    isArchived: { $ne: true },
    $or: [
      { hiringManagerId: uid },
      { hiringManagerId: null },
      { hiringManagerId: { $exists: false } },
    ],
    // Only candidates whose interview has been completed (interviewer provided rating/score/feedback)
    // or who are already selected
    $and: [
      {
        $or: [
          { 'interviews.status': 'completed' },
          { 'interviews.rating': { $ne: null } },
          { 'interviews.score': { $ne: null } },
          { 'interviews.feedback': { $ne: '' } },
          { status: { $in: ['selected', 'Selected', 'offer', 'Offer'] } },
          { 'hiringRecommendation.status': 'select' },
        ]
      }
    ]
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

exports.getDashboard = async (req, res, next) => {
  try {
    const query = assignedToManagerQuery(req);
    const [openRoles, candidateCount, interviewsThisWeek] = await Promise.all([
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
    ]);
    return res.json({
      success: true,
      data: { openRoles: openRoles.length, pipelineCandidates: candidateCount,
        interviewsThisWeek }
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
        code: 'NOT_FOUND', message: 'Candidate not found or not accessible'
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

    let isIntern = false;
    let newRole = 'employee';
    if (decision === 'select') {
      candidate.status = 'selected';
      isIntern = String(candidate.jobType || candidate.position || '').toLowerCase().includes('intern');
      newRole = isIntern ? 'intern' : 'employee';
      candidate.selectedAs = newRole;
      candidate.role = newRole;
    } else if (decision === 'reject') {
      candidate.status = 'rejected';
    }
    await candidate.save();

    // Sync Application model
    const candidateUserId = candidate.user || candidate.userId || candidate._id;
    const application = await Application.findOne({
      $or: [
        { candidateId: candidateUserId },
        { email: candidate.email ? candidate.email.toLowerCase() : null }
      ]
    }).sort({ appliedAt: -1 });

    if (application) {
      if (decision === 'select') {
        application.status = 'Selected';
        for (const event of application.timeline) {
          const stage = String(event.stage || '').trim().toLowerCase();
          if (stage === 'applied' || stage === 'interview') {
            event.completed = true;
          } else if (stage === 'selected') {
            event.completed = true;
            event.date = new Date();
            event.description = comments || `Candidate selected for ${isIntern ? 'Internship' : 'Full-time'}.`;
          }
        }
      } else {
        application.status = 'Rejected';
      }
      await application.save();
    }

    // AUTOMATIC ROLE CONVERSION:
    // If selected, automatically convert user role in User collection
    if (decision === 'select') {
      const userDoc = await User.findById(candidateUserId) || await User.findOne({ email: candidate.email.toLowerCase() });
      if (userDoc) {
        userDoc.role = newRole;
        userDoc.status = 'active';
        userDoc.isActive = true;
        userDoc.selectedAs = newRole;
        await userDoc.save();
      }
    }

    return res.status(201).json({ success: true, data: recommendation,
      message: `Hiring recommendation submitted: Candidate ${decision === 'select' ? 'selected and converted to ' + newRole : 'rejected'}` });
  } catch (err) { next(err); }
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
