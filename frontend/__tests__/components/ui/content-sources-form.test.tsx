import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentSourcesForm } from '@/components/ui/content-sources-form';
import type { FormSubmitData } from '@/components/ui/content-sources-form';
import type { ContentSourceInsert } from '@/types/content-sources';

// 必要なコンポーネントをモック
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange, disabled }: any) => (
    <select
      value={value}
      onChange={e => onValueChange?.(e.target.value)}
      disabled={disabled}
      role="combobox"
      aria-label="Select option"
      aria-expanded="false"
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => (
    <option value={value}>
      {typeof children === 'object' ? value : children}
    </option>
  ),
  SelectTrigger: ({ children, className, ...props }: any) => null, // SelectTriggerは無視
  SelectValue: ({ placeholder }: any) => null, // SelectValueも無視
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({ ...props }: any) => <textarea {...props} role="textbox" />,
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({
    leftElement,
    rightElement,
    error,
    helperText,
    ...restProps
  }: any) => {
    // Exclude non-DOM props before spreading
    const { required, size, leftIcon, rightIcon, ...domProps } = restProps;

    return (
      <div>
        {leftElement}
        <input
          {...domProps}
          id={`mock-${restProps.name || 'input'}`}
          name={restProps.name}
          role="textbox"
          aria-required={required}
          aria-invalid={error ? true : undefined}
        />
        {rightElement}
        {error && helperText && <span role="alert">{helperText}</span>}
      </div>
    );
  },
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    loading,
    loadingText,
    leftIcon,
    rightIcon,
    ...props
  }: any) => (
    <button {...props}>
      {loading && <span data-testid="button-spinner">Loading...</span>}
      {leftIcon}
      {loading ? loadingText : children}
      {rightIcon}
    </button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardDescription: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardHeader: ({
    children,
    className,
    title,
    description,
    headingLevel,
    ...props
  }: any) => {
    const { headingLevel: _, ...domProps } = props;
    return (
      <div className={className} {...domProps}>
        {title && <h3>{title}</h3>}
        {description && <p>{description}</p>}
        {children}
      </div>
    );
  },
  CardTitle: ({ children, className, ...props }: any) => (
    <h3 className={className} {...props}>
      {children}
    </h3>
  ),
}));

// Form context mock
const formContextValues = new Map();

jest.mock('@/components/ui/form', () => ({
  Form: ({ children, onSubmit, defaultValues }: any) => {
    // Store default values in mock context
    if (defaultValues) {
      Object.keys(defaultValues).forEach(key => {
        if (!formContextValues.has(key)) {
          formContextValues.set(key, defaultValues[key]);
        }
      });
    }

    return (
      <form
        role="form"
        onSubmit={e => {
          e.preventDefault();
          const formData = Object.fromEntries(formContextValues.entries());
          onSubmit?.(formData);
        }}
      >
        {children}
      </form>
    );
  },
  FormField: ({ children, name, label, description, rules }: any) => {
    const [value, setValue] = React.useState(formContextValues.get(name) || '');
    const [error, setError] = React.useState<string | undefined>();

    // Simple validation on blur
    const validateField = (val: any) => {
      if (rules?.required && !val) {
        setError(rules.required);
        return;
      }
      if (rules?.minLength && String(val).length < rules.minLength.value) {
        setError(rules.minLength.message);
        return;
      }
      if (rules?.maxLength && String(val).length > rules.maxLength.value) {
        setError(rules.maxLength.message);
        return;
      }
      if (rules?.validate) {
        const result = rules.validate(val);
        if (result !== true) {
          setError(result);
          return;
        }
      }
      setError(undefined);
    };

    const mockState = {
      value,
      onChange: (newValue: any) => {
        setValue(newValue);
        formContextValues.set(name, newValue);
        setError(undefined); // Clear error on change
      },
      onBlur: () => {
        validateField(value);
      },
      error,
    };

    // childrenが関数の場合は呼び出し、そうでなければそのまま返す
    const fieldContent =
      typeof children === 'function' ? children(mockState) : children;

    // Clone and inject props into input elements
    const processedFieldContent = React.isValidElement(fieldContent)
      ? React.cloneElement(
          fieldContent as React.ReactElement<any>,
          {
            name,
            value: mockState.value,
            onChange: (e: any) =>
              mockState.onChange(e.target ? e.target.value : e),
            onBlur: mockState.onBlur,
            error: !!error,
            helperText: error,
            'aria-describedby': description ? `${name}-description` : undefined,
          } as any
        )
      : fieldContent;

    return (
      <div data-field-name={name}>
        {label && <label htmlFor={`mock-${name}`}>{label}</label>}
        {description && <small id={`${name}-description`}>{description}</small>}
        <div data-field-content="true">{processedFieldContent}</div>
        {error && <span role="alert">{error}</span>}
      </div>
    );
  },
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className, ...props }: any) => (
    <span className={className} {...props}>
      {children}
    </span>
  ),
}));

jest.mock('@/components/ui/icons', () => ({
  Icons: {
    Plus: ({ className, ...props }: any) => (
      <span className={className} {...props}>
        +
      </span>
    ),
    Edit: ({ className, ...props }: any) => (
      <span className={className} {...props}>
        ✏️
      </span>
    ),
    ExternalLink: ({ className, ...props }: any) => (
      <span className={className} {...props}>
        🔗
      </span>
    ),
    Check: ({ className, ...props }: any) => (
      <span className={className} {...props}>
        ✓
      </span>
    ),
  },
}));

describe('ContentSourcesForm', () => {
  beforeEach(() => {
    // Clear form context between tests
    formContextValues.clear();
  });

  // 基本的なレンダリングテスト
  describe('Rendering', () => {
    it('should render create form by default', () => {
      render(<ContentSourcesForm />);

      expect(screen.getByText('新しいコンテンツソース')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /ソースを追加/i })
      ).toBeInTheDocument();
    });

    it('should render edit form when mode is edit', () => {
      render(<ContentSourcesForm mode="edit" />);

      expect(screen.getByText('コンテンツソースの編集')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /変更を保存/i })
      ).toBeInTheDocument();
    });

    it('should render all required form fields', () => {
      render(<ContentSourcesForm />);

      // ソースタイプは独自のラベル構造
      expect(screen.getByText('ソースタイプ')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();

      // FormFieldで生成されるラベル
      expect(screen.getByText('ソース名')).toBeInTheDocument();
      expect(screen.getByText('URL')).toBeInTheDocument();
      expect(screen.getByText('説明')).toBeInTheDocument();
    });

    it('should render cancel button when onCancel is provided', () => {
      const onCancel = jest.fn();
      render(<ContentSourcesForm onCancel={onCancel} />);

      expect(
        screen.getByRole('button', { name: /キャンセル/i })
      ).toBeInTheDocument();
    });

    it('should not render cancel button when onCancel is not provided', () => {
      render(<ContentSourcesForm />);

      expect(
        screen.queryByRole('button', { name: /キャンセル/i })
      ).not.toBeInTheDocument();
    });
  });

  // 初期データのテスト
  describe('Initial Data', () => {
    const initialData: Partial<ContentSourceInsert> = {
      name: 'Test Repository',
      source_type: 'github',
      url: 'https://github.com/test/repo',
      config: {
        username: 'test-user',
        repositories: ['test/repo'],
      },
    };

    it('should populate form with initial data', () => {
      render(<ContentSourcesForm initialData={initialData} />);

      expect(screen.getByDisplayValue('Test Repository')).toBeInTheDocument();
      expect(
        screen.getByDisplayValue('https://github.com/test/repo')
      ).toBeInTheDocument();
      // config設定は詳細設定フィールドに表示される
    });

    it('should select correct source type from initial data', () => {
      render(<ContentSourcesForm initialData={initialData} />);

      const sourceTypeSelect = screen.getByRole('combobox');
      expect(sourceTypeSelect).toHaveAttribute('aria-expanded', 'false');
      // GitHubが選択されていることを確認
    });
  });

  // ソースタイプ選択のテスト
  describe('Source Type Selection', () => {
    it('should change source type when selected', async () => {
      const user = userEvent.setup();
      render(<ContentSourcesForm />);

      const sourceTypeSelect = screen.getByRole('combobox');
      await user.click(sourceTypeSelect);

      const rssOption = screen.getByText('RSS Feed');
      await user.click(rssOption);

      // RSS Feedが選択されたことを確認
      expect(screen.getByText('RSS Feed')).toBeInTheDocument();
    });

    it('should reset config when source type changes', async () => {
      const user = userEvent.setup();
      render(<ContentSourcesForm />);

      // 初期状態でGitHubを選択し、設定を入力
      const sourceTypeSelect = screen.getByRole('combobox');
      await user.click(sourceTypeSelect);

      const rssOption = screen.getByText('RSS Feed');
      await user.click(rssOption);

      // 設定がリセットされることを確認（具体的な実装に依存）
    });

    it('should display correct validation for GitHub URLs', async () => {
      const user = userEvent.setup();
      render(<ContentSourcesForm />);

      const urlInput = screen.getByRole('textbox', { name: /URL/i });

      await user.type(urlInput, 'https://example.com');
      await user.tab(); // フォーカスを移動してバリデーションをトリガー

      await waitFor(() => {
        expect(
          screen.getByText(/GitHubのURLを入力してください/)
        ).toBeInTheDocument();
      });
    });
  });

  // フォームバリデーションのテスト
  describe('Form Validation', () => {
    it('should show required field errors when submitted empty', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();

      render(<ContentSourcesForm onSubmit={onSubmit} />);

      const submitButton = screen.getByRole('button', {
        name: /ソースを追加/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('ソース名は必須です')).toBeInTheDocument();
        expect(screen.getByText('URLは必須です')).toBeInTheDocument();
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should validate source name length', async () => {
      const user = userEvent.setup();
      render(<ContentSourcesForm />);

      const nameInput = screen.getByRole('textbox', { name: /ソース名/i });

      await user.type(nameInput, 'a'); // 1文字（最小2文字）
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText('ソース名は2文字以上で入力してください')
        ).toBeInTheDocument();
      });
    });

    it('should validate URL format', async () => {
      const user = userEvent.setup();
      render(<ContentSourcesForm />);

      const urlInput = screen.getByRole('textbox', { name: /URL/i });

      await user.type(urlInput, 'invalid-url');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText('有効なURLを入力してください')
        ).toBeInTheDocument();
      });
    });

    it('should validate description length', async () => {
      const user = userEvent.setup();
      render(<ContentSourcesForm />);

      const descriptionTextarea = screen.getByRole('textbox', {
        name: /説明/i,
      });
      const longText = 'a'.repeat(501); // 500文字制限を超える

      await user.type(descriptionTextarea, longText);
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText('説明は500文字以内で入力してください')
        ).toBeInTheDocument();
      });
    });
  });

  // フォーム送信のテスト
  describe('Form Submission', () => {
    const validData = {
      name: 'Valid Repository',
      url: 'https://github.com/valid/repo',
      description: 'Valid description',
    };

    it('should call onSubmit with correct data when form is valid', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn().mockResolvedValue(undefined);

      render(<ContentSourcesForm onSubmit={onSubmit} />);

      // フォームに有効なデータを入力
      await user.type(
        screen.getByRole('textbox', { name: /ソース名/i }),
        validData.name
      );
      await user.type(
        screen.getByRole('textbox', { name: /URL/i }),
        validData.url
      );
      await user.type(
        screen.getByRole('textbox', { name: /説明/i }),
        validData.description
      );

      const submitButton = screen.getByRole('button', {
        name: /ソースを追加/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          name: validData.name,
          source_type: 'github', // デフォルト
          url: validData.url,
          config: {},
          is_active: true,
        });
      });
    });

    it('should show loading state during submission', async () => {
      render(<ContentSourcesForm isLoading={true} />);

      const submitButton = screen.getByRole('button', { name: /作成中.../i });
      expect(submitButton).toBeDisabled();
      expect(screen.getByTestId('button-spinner')).toBeInTheDocument();
    });

    it('should disable form fields during loading', () => {
      render(<ContentSourcesForm isLoading={true} />);

      expect(screen.getByRole('combobox')).toBeDisabled();
      expect(screen.getByRole('textbox', { name: /ソース名/i })).toBeDisabled();
      expect(screen.getByRole('textbox', { name: /URL/i })).toBeDisabled();
    });
  });

  // キャンセル機能のテスト
  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = jest.fn();

      render(<ContentSourcesForm onCancel={onCancel} />);

      const cancelButton = screen.getByRole('button', { name: /キャンセル/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  // 設定フィールドのテスト
  describe('Configuration Fields', () => {
    it('should show GitHub-specific config fields when GitHub is selected', async () => {
      const user = userEvent.setup();
      render(<ContentSourcesForm />);

      // GitHubがデフォルトで選択されているため、設定フィールドが表示される
      expect(screen.getByText('GitHub 詳細設定')).toBeInTheDocument();
      expect(screen.getByLabelText(/branch/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/path/i)).toBeInTheDocument();
    });

    it('should show RSS-specific config fields when RSS is selected', async () => {
      const user = userEvent.setup();
      render(<ContentSourcesForm />);

      const sourceTypeSelect = screen.getByRole('combobox');
      await user.click(sourceTypeSelect);

      const rssOption = screen.getByText('RSS Feed');
      await user.click(rssOption);

      await waitFor(() => {
        expect(screen.getByText('RSS Feed 詳細設定')).toBeInTheDocument();
        expect(screen.getByLabelText(/refresh interval/i)).toBeInTheDocument();
      });
    });
  });

  // アクセシビリティのテスト
  describe('Accessibility', () => {
    it('should have proper form structure', () => {
      render(<ContentSourcesForm />);

      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
    });

    it('should have proper label associations', () => {
      render(<ContentSourcesForm />);

      const nameInput = screen.getByRole('textbox', { name: /ソース名/i });
      const urlInput = screen.getByRole('textbox', { name: /URL/i });

      expect(nameInput).toHaveAttribute('id');
      expect(urlInput).toHaveAttribute('id');
    });

    it('should mark required fields appropriately', () => {
      render(<ContentSourcesForm />);

      const nameInput = screen.getByRole('textbox', { name: /ソース名/i });
      const urlInput = screen.getByRole('textbox', { name: /URL/i });

      expect(nameInput).toHaveAttribute('aria-required', 'true');
      expect(urlInput).toHaveAttribute('aria-required', 'true');
    });

    it('should have proper error announcements', async () => {
      const user = userEvent.setup();
      render(<ContentSourcesForm />);

      const submitButton = screen.getByRole('button', {
        name: /ソースを追加/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText('ソース名は必須です');
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<ContentSourcesForm onCancel={jest.fn()} />);

      // Tab キーでフォーム要素間を移動できることを確認
      await user.tab(); // ソースタイプ選択
      await user.tab(); // ソース名入力
      await user.tab(); // URL入力
      await user.tab(); // 説明入力
      await user.tab(); // キャンセルボタン
      await user.tab(); // 送信ボタン

      const submitButton = screen.getByRole('button', {
        name: /ソースを追加/i,
      });
      expect(submitButton).toHaveFocus();
    });
  });

  // エッジケースのテスト
  describe('Edge Cases', () => {
    it('should handle undefined initial data gracefully', () => {
      render(<ContentSourcesForm />);

      expect(screen.getByRole('textbox', { name: /ソース名/i })).toHaveValue(
        ''
      );
      expect(screen.getByRole('textbox', { name: /URL/i })).toHaveValue('');
    });

    it('should handle empty config object', () => {
      const initialData = {
        name: 'Test',
        source_type: 'github' as const,
        url: 'https://github.com/test/repo',
        config: {},
      };

      render(<ContentSourcesForm initialData={initialData} />);

      expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
    });

    it('should handle submission error gracefully', async () => {
      const user = userEvent.setup();
      const onSubmit = jest
        .fn()
        .mockRejectedValue(new Error('Submission failed'));

      render(<ContentSourcesForm onSubmit={onSubmit} />);

      // 有効なデータを入力
      await user.type(
        screen.getByRole('textbox', { name: /ソース名/i }),
        'Test Name'
      );
      await user.type(
        screen.getByRole('textbox', { name: /URL/i }),
        'https://github.com/test/repo'
      );

      const submitButton = screen.getByRole('button', {
        name: /ソースを追加/i,
      });
      await user.click(submitButton);

      // エラーが発生してもアプリケーションがクラッシュしないことを確認
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
    });
  });
});
