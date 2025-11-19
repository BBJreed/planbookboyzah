import { useState, useCallback, useEffect } from 'react';

interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  email?: boolean;
  url?: boolean;
  number?: boolean;
  min?: number;
  max?: number;
}

interface FieldConfig {
  value: any;
  rules: ValidationRules;
  label: string;
}

interface ValidationError {
  field: string;
  message: string;
}

export const useFormValidation = (fields: Record<string, FieldConfig>) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((fieldName: string, value: any): string => {
    const field = fields[fieldName];
    if (!field) return '';

    const { rules, label } = field;

    // Required validation
    if (rules.required && (value === null || value === undefined || value === '')) {
      return `${label} is required`;
    }

    // Skip other validations if field is empty and not required
    if (value === null || value === undefined || value === '') {
      return '';
    }

    // Email validation
    if (rules.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return `${label} must be a valid email address`;
      }
    }

    // URL validation
    if (rules.url) {
      try {
        new URL(value);
      } catch (e) {
        return `${label} must be a valid URL`;
      }
    }

    // Number validation
    if (rules.number) {
      if (isNaN(Number(value))) {
        return `${label} must be a number`;
      }
    }

    // Min value validation
    if (rules.min !== undefined && rules.number) {
      const numValue = Number(value);
      if (numValue < rules.min) {
        return `${label} must be at least ${rules.min}`;
      }
    }

    // Max value validation
    if (rules.max !== undefined && rules.number) {
      const numValue = Number(value);
      if (numValue > rules.max) {
        return `${label} must be no more than ${rules.max}`;
      }
    }

    // Min length validation
    if (rules.minLength && value && value.length < rules.minLength) {
      return `${label} must be at least ${rules.minLength} characters`;
    }

    // Max length validation
    if (rules.maxLength && value && value.length > rules.maxLength) {
      return `${label} must be no more than ${rules.maxLength} characters`;
    }

    // Pattern validation
    if (rules.pattern && value && !rules.pattern.test(value)) {
      return `${label} is invalid`;
    }

    // Custom validation
    if (rules.custom) {
      const result = rules.custom(value);
      if (typeof result === 'string') {
        return result;
      } else if (result === false) {
        return `${label} is invalid`;
      }
    }

    return '';
  }, [fields]);

  const validateForm = useCallback((): ValidationError[] => {
    const newErrors: Record<string, string> = {};
    const errorList: ValidationError[] = [];

    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName];
      const errorMessage = validateField(fieldName, field.value);
      
      if (errorMessage) {
        newErrors[fieldName] = errorMessage;
        errorList.push({ field: fieldName, message: errorMessage });
      }
    });

    setErrors(newErrors);
    return errorList;
  }, [fields, validateField]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setFieldTouched = useCallback((fieldName: string, isTouched: boolean = true) => {
    setTouched(prev => ({ ...prev, [fieldName]: isTouched }));
  }, []);

  // Real-time validation when fields change
  useEffect(() => {
    const newErrors: Record<string, string> = {};


    Object.keys(fields).forEach(fieldName => {
      // Only validate fields that have been touched
      if (touched[fieldName]) {
        const field = fields[fieldName];
        const errorMessage = validateField(fieldName, field.value);
        
        if (errorMessage) {
          newErrors[fieldName] = errorMessage;
        }
      }
    });

    setErrors(newErrors);
  }, [fields, touched, validateField]);

  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    setFieldTouched,
    isValid: Object.keys(errors).length === 0,
    isFieldValid: (fieldName: string) => !errors[fieldName],
    getFieldError: (fieldName: string) => errors[fieldName] || ''
  };
};