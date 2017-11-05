# frozen_string_literal: true

class EventDispatcher < ApplicationRecord
  # Associations
  belongs_to :job
  belongs_to :event_receiver

  # Validations
  validates :triggered, presence: true

  def dispatch!(job)
    # 1) Don't perform an action if it has already been performed on the rising edge trigger
    # 2) Only perform the dispatch if the event_receiver's trigger condition has been met
    return if triggered || !event_receiver.trigger_condition_met?

    # Run each of the event actions corresponding to the job
    job.event_actions.each(&:run!)

    # Set the record to be triggered
    self.triggered = true
  end
end