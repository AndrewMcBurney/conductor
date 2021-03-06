# frozen_string_literal: true

class WorkerFactory < AbstractFactory
  attr_reader :id, :user
  def initialize(id, user)
    @id   = id
    @user = user
  end

  def create
    id ? Worker.find_by(id: id) : user&.workers&.create!
  end
end
