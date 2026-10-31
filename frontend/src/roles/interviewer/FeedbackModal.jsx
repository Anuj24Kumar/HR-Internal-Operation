import { Check, Star } from "lucide-react";

const RATING_LABELS = {
  1: "1 - Does not meet requirements",
  2: "2 - Below expectations / partial fit",
  3: "3 - Meets job requirements",
  4: "4 - Strong hire / exceeds expectations",
  5: "5 - Exceptional candidate / top tier",
};

export default function FeedbackModal({
  selectedRound,
  setSelectedRound,
  isUpdate,
  handleSubmitFeedback,
  hoverRating,
  setHoverRating,
  rating,
  setRating,
  feedback,
  setFeedback,
  submittingFeedback,
}) {
  if (!selectedRound) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={() => setSelectedRound(null)}>
      <div className="modal-dialog" onClick={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <h3 className="modal-title">
            {isUpdate ? "Update Interview Evaluation" : "Submit Interview Assessment"}
          </h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={() => setSelectedRound(null)}
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmitFeedback}>
          <div className="modal-body">
            <div className="candidate-detail-header">
              <div className="candidate-avatar" style={{ background: "#ecfdf5", color: "#059669" }}>
                {(selectedRound.candidate?.name || "C").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 style={{ fontSize: "17px", fontWeight: 700 }}>
                  {selectedRound.candidate?.name}
                </h4>
                <p style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
                  {selectedRound.candidate?.position} • Round {selectedRound.interview.round}
                </p>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <span className="status-pill interview">In Interview</span>
              </div>
            </div>

            <div className="detail-info-grid">
              <div className="detail-info-item">
                <span className="detail-info-label">Candidate Email</span>
                <span className="detail-info-val">{selectedRound.candidate?.email || "—"}</span>
              </div>
              <div className="detail-info-item">
                <span className="detail-info-label">Phone</span>
                <span className="detail-info-val">{selectedRound.candidate?.phone || "—"}</span>
              </div>
              <div className="detail-info-item">
                <span className="detail-info-label">Source</span>
                <span className="detail-info-val">{selectedRound.candidate?.source || "Direct"}</span>
              </div>
              <div className="detail-info-item">
                <span className="detail-info-label">Interview Date</span>
                <span className="detail-info-val">
                  {new Date(selectedRound.interview.scheduledAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Performance Rating (1 to 5 Stars)</span>
                <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>Required</span>
              </label>

              <div className="interactive-stars">
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isFilled = (hoverRating || rating) >= starValue;
                  return (
                    <button
                      key={starValue}
                      type="button"
                      className="star-select-btn"
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(starValue)}
                    >
                      <Star size={28} className={`star-icon ${isFilled ? "filled" : ""}`} />
                    </button>
                  );
                })}

                <span className="rating-descriptor">
                  {RATING_LABELS[hoverRating || rating]}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="feedback-text">
                <span>Detailed Evaluation & Technical Notes</span>
                <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>Required</span>
              </label>
              <textarea
                id="feedback-text"
                rows={4}
                required
                className="form-textarea"
                placeholder="Assess technical depth, problem-solving, architectural thinking, strengths, and areas of concern..."
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
              />
            </div>
          </div>

          <footer className="modal-footer">
            <button
              type="button"
              className="btn-action-outline"
              onClick={() => setSelectedRound(null)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="auth-btn-primary"
              style={{ width: "auto", margin: 0 }}
              disabled={submittingFeedback}
            >
              {submittingFeedback ? (
                <span>Submitting Assessment...</span>
              ) : (
                <>
                  <Check size={16} />
                  <span>{isUpdate ? "Save Changes" : "Submit Evaluation"}</span>
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
