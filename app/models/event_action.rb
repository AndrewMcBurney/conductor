# frozen_string_literal: true

class EventAction < ApplicationRecord
  # Associations
  belongs_to :event_receiver
  belongs_to :job_type, optional: true

  # Validations
  validate  :owned_job_type?
  validates :type, presence: true

  PROPERTIES = %i(job_type_id email_address webhook_url webhook_body type)

  def run!(_user)
    raise NotImplementedError, "EventAction::run!(user) is a pure virtual method."
  end

  def owned_job_type?
    return unless job_type && job_type.user != event_action.user
    errors.add(:job_type, "must be one of your jobs")
  end
end
