import { useState, useEffect, useCallback } from 'react';

interface FeatureFlagConfig {
  [key: string]: boolean | FeatureFlagRule;
}

interface FeatureFlagRule {
  enabled: boolean;
  conditions?: FeatureFlagCondition[];
}

interface FeatureFlagCondition {
  type: 'userRole' | 'userSegment' | 'deviceType' | 'dateRange' | 'custom';
  value: any;
  operator?: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains';
}

interface FeatureFlagContext {
  userId?: string;
  userRole?: string;
  userSegment?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  currentDate?: Date;
  [key: string]: any;
}

export const useFeatureFlag = (config: FeatureFlagConfig, context: FeatureFlagContext = {}) => {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  
  // Evaluate feature flag rules
  const evaluateFlag = useCallback((key: string, rule: boolean | FeatureFlagRule): boolean => {
    // Simple boolean flag
    if (typeof rule === 'boolean') {
      return rule;
    }
    
    // Check if flag is explicitly disabled
    if (!rule.enabled) {
      return false;
    }
    
    // No conditions means always enabled
    if (!rule.conditions || rule.conditions.length === 0) {
      return true;
    }
    
    // Log flag evaluation for debugging
    console.debug(`Evaluating feature flag: ${key}`);
    
    // Evaluate all conditions
    return rule.conditions.every(condition => {
      switch (condition.type) {
        case 'userRole':
          return evaluateCondition(context.userRole, condition);
        case 'userSegment':
          return evaluateCondition(context.userSegment, condition);
        case 'deviceType':
          return evaluateCondition(context.deviceType, condition);
        case 'dateRange':
          return evaluateDateCondition(context.currentDate || new Date(), condition);
        case 'custom':
          return condition.value(context);
        default:
          return false;
      }
    });
  }, [context]);
  
  // Evaluate a single condition
  const evaluateCondition = useCallback((value: any, condition: FeatureFlagCondition): boolean => {
    const conditionValue = condition.value;
    const operator = condition.operator || 'equals';
    
    switch (operator) {
      case 'equals':
        return value === conditionValue;
      case 'notEquals':
        return value !== conditionValue;
      case 'greaterThan':
        return value > conditionValue;
      case 'lessThan':
        return value < conditionValue;
      case 'contains':
        return Array.isArray(conditionValue) && conditionValue.includes(value);
      default:
        return value === conditionValue;
    }
  }, []);
  
  // Evaluate date condition
  const evaluateDateCondition = useCallback((currentDate: Date, condition: FeatureFlagCondition): boolean => {
    if (!condition.value || typeof condition.value !== 'object') {
      return false;
    }
    
    const { start, end } = condition.value;
    
    if (start && currentDate < new Date(start)) {
      return false;
    }
    
    if (end && currentDate > new Date(end)) {
      return false;
    }
    
    return true;
  }, []);
  
  // Initialize flags
  useEffect(() => {
    const evaluatedFlags: Record<string, boolean> = {};
    
    Object.keys(config).forEach(key => {
      evaluatedFlags[key] = evaluateFlag(key, config[key]);
    });
    
    setFlags(evaluatedFlags);
  }, [config, context, evaluateFlag]);
  
  // Check if a feature is enabled
  const isEnabled = useCallback((flagName: string): boolean => {
    return flags[flagName] ?? false;
  }, [flags]);
  
  // Override a flag value (useful for testing)
  const overrideFlag = useCallback((flagName: string, value: boolean) => {
    setFlags(prev => ({
      ...prev,
      [flagName]: value
    }));
  }, []);
  
  // Reset all flags to config values
  const resetFlags = useCallback(() => {
    const evaluatedFlags: Record<string, boolean> = {};
    
    Object.keys(config).forEach(key => {
      evaluatedFlags[key] = evaluateFlag(key, config[key]);
    });
    
    setFlags(evaluatedFlags);
  }, [config, evaluateFlag]);
  
  return {
    flags,
    isEnabled,
    overrideFlag,
    resetFlags
  };
};

export default useFeatureFlag;