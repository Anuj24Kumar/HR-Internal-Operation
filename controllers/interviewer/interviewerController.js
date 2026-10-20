const mongoose = require('mongoose');
const Candidate = require('../../models/Candidate');
const InterviewFeedback = require('../../models/interviewer/InterviewFeedback');

const userIdOf = (req) => req.user?._id || req.user?.id;
const sameId = (a, b) => String(a || '') === String(b || '');
const normalizedRole = (req) => String(req.user?.role || '').toLowerCase();

function stripSensitive(candidate) {
  const obj = typeof candidate.toObject === 'function' ? candidate.toObject() : { ...candidate };
  for (const key of ['salary', 'ctc', 'offer', 'offerDetails', 'salaryDetails']) delete obj[key];
  if (Array.isArray(obj.interviews)) {
    obj.interviews = obj.interviews.map(round => {
      const clean = { ...round };
      for (const key of ['salary', 'ctc', 'offer', 'offerDetails']) delete clean[key];
      return clean;
    });
  }
  return obj;
}

function assignedRound(candidate, roundId, interviewerId) {
  const round = candidate.interviews?.find(r =>
    (sameId(r._id, roundId) || sameId(r.round, roundId)) &&
    sameId(r.interviewerId?._id || r.interviewerId, interviewerId)
  );
  return round || null;
}

exports.listMyInterviews = async (req, res, next) => {
  try {
    const uid = userIdOf(req);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const candidates = await Candidate.find({
      isArchived: { $ne: true },
      'interviews.interviewerId': uid
    })
      .select('-salary -ctc -offer -offerDetails -salaryDetails')
      .sort({ createdAt: -1 }).lean();
    const rounds = [];
    for (const candidate of candidates) {
      for (const round of (candidate.interviews || [])) {
        if (sameId(round.interviewerId, uid)) {
          rounds.push({
            candidate: stripSensitive({ ...candidate, interviews: undefined }),
            interview: round
          });
        }
      }
    }
    rounds.sort((a, b) => new Date(b.interview.scheduledAt || 0) - new Date(a.interview.scheduledAt || 0));
    const total = rounds.length;
    const data = rounds.slice((page - 1) * limit, page * limit);
    return res.json({ success: true, data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.getMyInterview = async (req, res, next) => {
  try {
    const uid = userIdOf(req);
    const candidates = await Candidate.find({
      'interviews.interviewerId': uid
    }).select('-salary -ctc -offer -offerDetails -salaryDetails').lean();
    for (const candidate of candidates) {
      const round = assignedRound(candidate, req.params.roundId, uid);
      if (round) {
        return res.json({ success: true, data: {
          candidate: stripSensitive({ ...candidate, interviews: undefined }),
          interview: round
        }});
      }
    }
    return res.status(404).json({ success: false, error: {
      code: 'NOT_FOUND', message: 'Interview round not found or not assigned to you'
    }});
  } catch (err) { next(err); }
};

async function saveFeedback(req, res, next, isUpdate) {
  try {
    const rating = Number(req.body.rating);
    const feedback = String(req.body.feedback || '').trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !feedback) {
      return res.status(400).json({ success: false, error: {
        code: 'VALIDATION_ERROR', message: 'rating must be an integer from 1 to 5 and feedback is required'
      }});
    }
    const candidate = await Candidate.findOne({
      _id: req.params.id,
      'interviews.interviewerId': userIdOf(req)
    });
    if (!candidate) return res.status(404).json({ success: false, error: {
      code: 'NOT_FOUND', message: 'Candidate or assigned interview not found'
    }});
    const round = assignedRound(candidate, req.params.roundId, userIdOf(req));
    if (!round) return res.status(404).json({ success: false, error: {
      code: 'NOT_FOUND', message: 'Interview round not found or not assigned to you'
    }});
    if (round.lockedAt || round.feedbackLocked === true) {
      return res.status(422).json({ success: false, error: {
        code: 'ROUND_LOCKED', message: 'Feedback is locked by HR and can no longer be changed'
      }});
    }
    const hasFeedback = round.rating != null || Boolean(round.feedback?.trim());
    if (isUpdate && !hasFeedback) {
      return res.status(404).json({ success: false, error: {
        code: 'NOT_FOUND', message: 'Interview feedback has not been submitted'
      }});
    }
    if (!isUpdate && hasFeedback) {
      return res.status(409).json({ success: false, error: {
        code: 'FEEDBACK_EXISTS', message: 'Interview feedback has already been submitted'
      }});
    }

    round.rating = rating;
    round.feedback = feedback;
    round.feedbackSubmittedAt = new Date();
    await candidate.save();

    await InterviewFeedback.findOneAndUpdate(
      { candidateId: candidate._id, roundId: round._id || req.params.roundId, interviewerId: userIdOf(req) },
      { $set: { rating, feedback, submittedAt: new Date() } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(isUpdate ? 200 : 201).json({
      success: true,
      data: { candidateId: candidate._id, roundId: round._id, rating, feedback },
      message: isUpdate ? 'Interview feedback updated' : 'Interview feedback submitted'
    });
  } catch (err) {
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ success: false, error: {
        code: 'VALIDATION_ERROR', message: 'Invalid candidate or interview ID'
      }});
    }
    next(err);
  }
}
exports.submitFeedback = (req, res, next) => saveFeedback(req, res, next, false);
exports.updateFeedback = (req, res, next) => saveFeedback(req, res, next, true);

exports.getFeedback = async (req, res, next) => {
  try {
    const role = normalizedRole(req);
    const query = { _id: req.params.id };
    if (role === 'interviewer') query['interviews.interviewerId'] = userIdOf(req);
    if (role === 'hiring_manager') query.hiringManagerId = userIdOf(req);
    const candidate = await Candidate.findOne(query)
      .select('-salary -ctc -offer -offerDetails -salaryDetails').lean();
    if (!candidate) return res.status(404).json({ success: false, error: {
      code: 'NOT_FOUND', message: 'Candidate not found or not visible to you'
    }});
    const round = role === 'interviewer'
      ? assignedRound(candidate, req.params.roundId, userIdOf(req))
      : candidate.interviews?.find(r =>
          sameId(r._id, req.params.roundId) || sameId(r.round, req.params.roundId)
        );
    if (!round) return res.status(404).json({ success: false, error: {
      code: 'NOT_FOUND', message: 'Interview round not found or not visible to you'
    }});
    return res.json({ success: true, data: {
      candidateId: candidate._id, roundId: round._id,
      rating: round.rating ?? null, feedback: round.feedback ?? '',
      feedbackSubmittedAt: round.feedbackSubmittedAt ?? null
    }});
  } catch (err) {
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ success: false, error: {
        code: 'VALIDATION_ERROR', message: 'Invalid candidate or interview ID'
      }});
    }
    next(err);
  }
};
