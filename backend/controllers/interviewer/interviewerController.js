const mongoose = require('mongoose');
const Candidate = require('../../models/Candidate');
const Interview = require('../../models/Interview');
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
      .populate({
        path: 'interviews.interviewRecordId',
        select: 'roundName interviewType scheduledAt status meetingLink interviewerId',
        populate: { path: 'interviewerId', select: 'name firstName lastName email' }
      })
      .select('-salary -ctc -offer -offerDetails -salaryDetails')
      .sort({ createdAt: -1 }).lean();
    const interviewRecords = await Interview.find({
      candidateId: { $in: candidates.map(candidate => candidate._id) },
      interviewerId: uid
    }).lean();
    const recordsById = new Map(
      interviewRecords.map(record => [String(record._id), record])
    );
    const rounds = [];
    for (const candidate of candidates) {
      for (const round of (candidate.interviews || [])) {
        if (sameId(round.interviewerId, uid)) {
          const recordId = round.interviewRecordId?._id || round.interviewRecordId;
          const record = recordsById.get(String(recordId)) ||
            (round.interviewRecordId && typeof round.interviewRecordId === 'object'
              ? round.interviewRecordId
              : null);
          rounds.push({
            candidate: stripSensitive({ ...candidate, interviews: undefined }),
            interview: {
              ...round,
              roundName: record?.roundName || round.roundName || '',
              interviewType: record?.interviewType || round.interviewType || 'technical',
              scheduledAt: record?.scheduledAt || round.scheduledAt || null,
              status: record?.status || round.status || 'scheduled',
              meetingLink: record?.meetingLink || round.meetingLink || '',
              score: round.score ?? record?.score ?? null,
              rating: round.rating ?? record?.rating ?? null,
              feedback: round.feedback || record?.feedback || '',
              feedbackSubmittedAt: round.feedbackSubmittedAt || record?.feedbackSubmittedAt || null,
              interviewer: record?.interviewerId || null,
            }
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
    const hasScore = req.body.score !== undefined && req.body.score !== null && req.body.score !== '';
    const score = hasScore ? Number(req.body.score) : null;
    const feedback = String(req.body.feedback || '').trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !feedback ||
        (hasScore && (!Number.isInteger(score) || score < 0 || score > 100))) {
      return res.status(400).json({ success: false, error: {
        code: 'VALIDATION_ERROR',
        message: 'rating must be 1 to 5, score must be 0 to 100 when provided, and feedback is required'
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
    if (hasScore) round.score = score;
    round.feedback = feedback;
    round.feedbackSubmittedAt = new Date();
    await candidate.save();

    const submittedAt = round.feedbackSubmittedAt;
    await InterviewFeedback.findOneAndUpdate(
      { candidateId: candidate._id, roundId: round._id || req.params.roundId, interviewerId: userIdOf(req) },
      { $set: { rating, score: round.score ?? null, feedback, submittedAt } },
      { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
    );

    if (round.interviewRecordId) {
      await Interview.updateOne(
        { _id: round.interviewRecordId, candidateId: candidate._id, interviewerId: userIdOf(req) },
        { $set: { rating, score: round.score ?? null, feedback, feedbackSubmittedAt: submittedAt } }
      );
    }

    return res.status(isUpdate ? 200 : 201).json({
      success: true,
      data: { candidateId: candidate._id, roundId: round._id, score: round.score ?? null, rating, feedback },
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
exports.submitFeedback = (req, res, next) => {
  if (String(req.body.status || '').toLowerCase() === 'completed') {
    return exports.completeInterview(req, res, next);
  }
  return saveFeedback(req, res, next, false);
};
exports.updateFeedback = (req, res, next) => {
  if (String(req.body.status || '').toLowerCase() === 'completed') {
    return exports.completeInterview(req, res, next);
  }
  return saveFeedback(req, res, next, true);
};

exports.completeInterview = async (req, res, next) => {
  try {
    const candidate = await Candidate.findOne({
      _id: req.params.id,
      'interviews.interviewerId': userIdOf(req)
    });
    if (!candidate) {
      return res.status(404).json({ success: false, error: {
        code: 'NOT_FOUND', message: 'Candidate or assigned interview not found'
      }});
    }

    const round = assignedRound(candidate, req.params.roundId, userIdOf(req));
    if (!round) {
      return res.status(404).json({ success: false, error: {
        code: 'NOT_FOUND', message: 'Interview round not found or not assigned to you'
      }});
    }
    if (round.status === 'cancelled') {
      return res.status(409).json({ success: false, error: {
        code: 'INVALID_STATUS', message: 'A cancelled interview cannot be marked completed'
      }});
    }
    if (round.status === 'completed') {
      return res.status(200).json({
        success: true,
        message: 'Interview is already completed',
        data: { candidateId: candidate._id, roundId: round._id, status: round.status }
      });
    }

    const score = Number(req.body.score);
    const rating = Number(req.body.rating);
    const feedback = String(req.body.feedback || '').trim();
    if (
      req.body.score === undefined || req.body.score === null || req.body.score === '' ||
      !Number.isInteger(score) || score < 0 || score > 100 ||
      !Number.isInteger(rating) || rating < 1 || rating > 5 ||
      !feedback || feedback.length > 5000
    ) {
      return res.status(400).json({ success: false, error: {
        code: 'VALIDATION_ERROR',
        message: 'Provide a whole-number score from 0 to 100, a 1 to 5 star rating, and feedback of up to 5000 characters'
      }});
    }

    const interviewRecordId = round.interviewRecordId?._id || round.interviewRecordId;
    let updatedRecord = null;
    if (interviewRecordId && mongoose.Types.ObjectId.isValid(interviewRecordId)) {
      updatedRecord = await Interview.findOneAndUpdate(
        {
          _id: interviewRecordId,
          candidateId: candidate._id,
          interviewerId: userIdOf(req),
          status: { $ne: 'cancelled' }
        },
        { $set: {
          status: 'completed',
          score,
          rating,
          feedback,
          feedbackSubmittedAt: new Date()
        } },
        { returnDocument: 'after', runValidators: true }
      );
      if (!updatedRecord) {
        return res.status(409).json({ success: false, error: {
          code: 'INTERVIEW_RECORD_MISMATCH',
          message: 'The scheduled interview record is missing or no longer assigned to you'
        }});
      }
    }

    const previousState = {
      status: round.status,
      score: round.score,
      rating: round.rating,
      feedback: round.feedback,
      feedbackSubmittedAt: round.feedbackSubmittedAt
    };
    const submittedAt = new Date();
    round.status = 'completed';
    round.score = score;
    round.rating = rating;
    round.feedback = feedback;
    round.feedbackSubmittedAt = submittedAt;
    try {
      await candidate.save();
      await InterviewFeedback.findOneAndUpdate(
        { candidateId: candidate._id, roundId: round._id, interviewerId: userIdOf(req) },
        { $set: {
          score,
          rating,
          feedback,
          submittedAt: round.feedbackSubmittedAt
        } },
        { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
      );
    } catch (error) {
      round.status = previousState.status;
      round.score = previousState.score;
      round.rating = previousState.rating;
      round.feedback = previousState.feedback;
      round.feedbackSubmittedAt = previousState.feedbackSubmittedAt;
      try {
        await candidate.save();
      } catch (rollbackError) {
        console.error('Candidate interview evaluation rollback error:', rollbackError.message);
      }
      if (updatedRecord) {
        try {
          await Interview.updateOne(
            { _id: updatedRecord._id },
            { $set: {
              status: previousState.status || 'scheduled',
              score: previousState.score ?? null,
              rating: previousState.rating ?? null,
              feedback: previousState.feedback || '',
              feedbackSubmittedAt: previousState.feedbackSubmittedAt ?? null
            } }
          );
        } catch (rollbackError) {
          console.error('Interview completion rollback error:', rollbackError.message);
        }
      }
      throw error;
    }

    return res.json({
      success: true,
      message: 'Interview marked as completed',
      data: { candidateId: candidate._id, roundId: round._id, status: round.status }
    });
  } catch (err) {
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ success: false, error: {
        code: 'VALIDATION_ERROR', message: 'Invalid candidate or interview ID'
      }});
    }
    next(err);
  }
};

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
      score: round.score ?? null, rating: round.rating ?? null, feedback: round.feedback ?? '',
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
