# frozen_string_literal: true

class HomeController < ApplicationController
  skip_before_action :authenticate_user!

  def index
    BaseWorker.perform_async("Test this out.")
  end
end
