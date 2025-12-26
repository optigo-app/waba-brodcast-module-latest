import React from 'react';
import { Settings } from 'lucide-react';
import StepperNavigation from './NavigationStepper/StepperNavigation';


const CampaignSettings = ({
  marketingSettings,
  utmParameters,
  conversionGoal,
  onUtmParametersChange,
  onConversionGoalChange,
  onMarketingSettingsChange,
  onNext, onPrevious, prevDisabled, nextDisabled, currentStep, steps
}) => {
  return (
    <>
      <div className="space-y-6">
        {/* Marketing Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">{currentStep}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Setup settings for marketing (optional)</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5 text-gray-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Enable Marketing Analytics</h4>
                  <p className="text-sm text-gray-600">Track opens, clicks, and engagement metrics</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingSettings}
                  onChange={(e) => onMarketingSettingsChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">UTM Parameters</h4>
                <input
                  type="text"
                  placeholder="campaign_name"
                  value={utmParameters}
                  onChange={(e) => onUtmParametersChange && onUtmParametersChange(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Conversion Tracking</h4>
                <select
                  value={conversionGoal}
                  onChange={(e) => onConversionGoalChange && onConversionGoalChange(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="">Select goal</option>
                  <option value="visit">Website Visit</option>
                  <option value="purchase">Purchase</option>
                  <option value="signup">Sign Up</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      <StepperNavigation
        onNext={onNext}
        onPrevious={onPrevious}
        prevDisabled={prevDisabled}
        nextDisabled={nextDisabled}
        currentStep={currentStep}
        steps={steps}
      />
    </>
  );
};

export default CampaignSettings;