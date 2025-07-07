import * as React from 'react';
import { cn } from '@/lib/utils';
import type {
  FormProps,
  FormFieldProps,
  FormFieldState,
  ValidationRule,
} from '@/types/ui';

// Form Context for sharing state between Form and FormField components
interface FormContextValue {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  dirty: Record<string, boolean>;
  isSubmitting: boolean;
  mode: 'onSubmit' | 'onBlur' | 'onChange' | 'all';
  defaultValues: Record<string, unknown>;
  setValue: (name: string, value: unknown) => void;
  setError: (name: string, error: string) => void;
  setTouched: (name: string, touched: boolean) => void;
  validateField: (
    name: string,
    value: unknown,
    rules?: ValidationRule
  ) => Promise<string | undefined>;
}

const FormContext = React.createContext<FormContextValue | null>(null);

// Hook to access form context
const useFormContext = () => {
  const context = React.useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a Form component');
  }
  return context;
};

// Validation function
const validateValue = async (
  value: unknown,
  rules?: ValidationRule
): Promise<string | undefined> => {
  if (!rules) return undefined;

  // Required validation
  if (rules.required) {
    const isEmpty = value === undefined || value === null || value === '';
    if (isEmpty) {
      return typeof rules.required === 'string'
        ? rules.required
        : 'This field is required';
    }
  }

  // Skip other validations if value is empty and not required
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const stringValue = String(value);

  // Minimum length validation
  if (rules.minLength && stringValue.length < rules.minLength.value) {
    return rules.minLength.message;
  }

  // Maximum length validation
  if (rules.maxLength && stringValue.length > rules.maxLength.value) {
    return rules.maxLength.message;
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.value.test(stringValue)) {
    return rules.pattern.message;
  }

  // Custom validation
  if (rules.validate) {
    const result = await rules.validate(value);
    if (typeof result === 'string') {
      return result;
    }
    if (result === false) {
      return 'Validation failed';
    }
  }

  return undefined;
};

// Form component
const Form = React.forwardRef<HTMLFormElement, FormProps>(
  (
    {
      className,
      onSubmit,
      defaultValues = {},
      mode = 'onSubmit',
      children,
      ...props
    },
    ref
  ) => {
    const [values, setValues] =
      React.useState<Record<string, unknown>>(defaultValues);
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [touched, setTouched] = React.useState<Record<string, boolean>>({});
    const [dirty, setDirty] = React.useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const fieldRulesRef = React.useRef<Record<string, ValidationRule>>({});

    // Set field value
    const setValue = React.useCallback(
      (name: string, value: unknown) => {
        setValues(prev => ({ ...prev, [name]: value }));

        // Mark field as dirty if value has changed from default
        const isChanged = value !== defaultValues[name];
        setDirty(prev => ({ ...prev, [name]: isChanged }));

        // Clear error when value changes (for better UX)
        if (errors[name]) {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
          });
        }
      },
      [defaultValues, errors]
    );

    // Set field error
    const setError = React.useCallback((name: string, error: string) => {
      setErrors(prev => ({ ...prev, [name]: error }));
    }, []);

    // Set field touched state
    const setFieldTouched = React.useCallback(
      (name: string, touchedValue: boolean) => {
        setTouched(prev => ({ ...prev, [name]: touchedValue }));
      },
      []
    );

    // Validate single field
    const validateField = React.useCallback(
      async (
        name: string,
        value: unknown,
        rules?: ValidationRule
      ): Promise<string | undefined> => {
        const error = await validateValue(value, rules);
        if (error) {
          setError(name, error);
        } else {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
          });
        }
        return error;
      },
      [setError]
    );

    // Validate all fields
    const validateAllFields = React.useCallback(async (): Promise<boolean> => {
      const fieldNames = Object.keys(fieldRulesRef.current);
      const validationPromises = fieldNames.map(async name => {
        const value = values[name];
        const rules = fieldRulesRef.current[name];
        const error = await validateField(name, value, rules);
        return { name, error };
      });

      const results = await Promise.all(validationPromises);
      const hasErrors = results.some(result => !!result.error);

      return !hasErrors;
    }, [values, validateField]);

    // Handle form submission
    const handleSubmit = React.useCallback(
      async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setIsSubmitting(true);

        try {
          // Validate all fields before submission
          const isValid = await validateAllFields();

          if (isValid) {
            await onSubmit(values);
          }
        } catch (error) {
          console.error('Form submission error:', error);
        } finally {
          setIsSubmitting(false);
        }
      },
      [values, onSubmit, validateAllFields]
    );

    // Context value
    const contextValue: FormContextValue = React.useMemo(
      () => ({
        values,
        errors,
        touched,
        dirty,
        isSubmitting,
        mode,
        defaultValues,
        setValue,
        setError,
        setTouched: setFieldTouched,
        validateField,
      }),
      [
        values,
        errors,
        touched,
        dirty,
        isSubmitting,
        mode,
        defaultValues,
        setValue,
        setError,
        setFieldTouched,
        validateField,
      ]
    );

    // Handle field registration
    const registerField = React.useCallback(
      (name: string, rules?: ValidationRule) => {
        fieldRulesRef.current[name] = rules || {};
      },
      []
    );

    // Enhanced context value with registration
    const enhancedContextValue = React.useMemo(
      () => ({
        ...contextValue,
        registerField,
      }),
      [contextValue, registerField]
    );

    return (
      <FormContext.Provider value={enhancedContextValue}>
        <form
          ref={ref}
          role="form"
          className={cn('space-y-6', className)}
          onSubmit={handleSubmit}
          {...props}
        >
          {typeof children === 'function'
            ? children({ isSubmitting, values, errors })
            : children}
        </form>
      </FormContext.Provider>
    );
  }
);
Form.displayName = 'Form';

// FormField component
const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ name, label, description, rules, defaultValue, children }, ref) => {
    const {
      values,
      errors,
      touched,
      dirty,
      mode,
      defaultValues,
      setValue,
      setTouched,
      validateField,
      registerField,
    } = useFormContext() as FormContextValue & {
      registerField: (name: string, rules?: ValidationRule) => void;
    };

    const initializedRef = React.useRef(false);

    // Register field and set initial value on mount
    React.useEffect(() => {
      if (!initializedRef.current) {
        registerField(name, rules);

        // Set default value if provided (field defaultValue overrides form defaultValues)
        if (defaultValue !== undefined) {
          setValue(name, defaultValue);
        } else if (defaultValues[name] !== undefined) {
          // Use form's default value if field has no default
          setValue(name, defaultValues[name]);
        }

        initializedRef.current = true;
      }
    }, [name, rules, defaultValue, defaultValues, registerField, setValue]);

    // Get field value (defaultValue overrides form defaultValues)
    const fieldValue = values[name] ?? defaultValue ?? '';
    const fieldError = errors[name];
    const fieldTouched = touched[name] ?? false;
    const fieldDirty = dirty[name] ?? false;

    // Handle field value change
    const handleChange = React.useCallback(
      async (value: unknown) => {
        setValue(name, value);

        // Validate on change if mode requires it
        if (mode === 'onChange' || mode === 'all') {
          await validateField(name, value, rules);
        }
      },
      [name, setValue, mode, validateField, rules]
    );

    // Handle field blur
    const handleBlur = React.useCallback(async () => {
      setTouched(name, true);

      // Validate on blur if mode requires it
      if (mode === 'onBlur' || mode === 'all') {
        await validateField(name, fieldValue, rules);
      }
    }, [name, setTouched, mode, validateField, fieldValue, rules]);

    // Field state for children function
    const fieldState: FormFieldState = {
      value: fieldValue,
      error: fieldError,
      touched: fieldTouched,
      dirty: fieldDirty,
    };

    // Enhanced field state with handlers
    const enhancedFieldState = {
      ...fieldState,
      onChange: handleChange,
      onBlur: handleBlur,
    };

    return (
      <div ref={ref} className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}

        {children(enhancedFieldState)}

        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    );
  }
);
FormField.displayName = 'FormField';

export { Form, FormField, useFormContext };
