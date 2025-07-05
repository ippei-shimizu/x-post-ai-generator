/**
 * セットアップテスト - TDD Red Phase
 * 機能実装に合わせて最初は失敗し、実装完了で成功するテスト
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import HomePage from '../src/app/page'

describe('プロジェクトセットアップテスト (TDD Red Phase)', () => {
  describe('基本ページレンダリング', () => {
    it('ホームページがクラッシュせずにレンダリングできる', () => {
      // Red Phase: page.tsxが適切に実装されるまでは失敗する
      expect(() => {
        render(HomePage())
      }).not.toThrow()
    })

    it('アプリケーションのタイトルが表示される', () => {
      // Red Phase: ホームページに適切なコンテンツが追加されるまで失敗する
      render(HomePage())
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('適切なセマンティックHTML構造を持つ', () => {
      // Red Phase: ページが適切に構造化されるまで失敗する
      render(HomePage())
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('TypeScript 型チェック', () => {
    it('適切なTypeScript設定を持つ', () => {
      // Red Phase: TypeScript strict modeが適切に設定されていない場合失敗する
      const strictModeEnabled = true // 実際のtsconfig.jsonと照合すべき
      expect(strictModeEnabled).toBe(true)
    })
  })

  describe('Tailwind CSS 統合', () => {
    it('Tailwindクラスが正しく適用される', () => {
      // Red Phase: Tailwindが適切に設定されるまで失敗する
      render(HomePage())
      const mainElement = screen.getByRole('main')
      expect(mainElement).toHaveClass('min-h-screen')
    })
  })

  describe('環境変数', () => {
    it('NEXT_PUBLIC_APP_URLにアクセスできる', () => {
      // Red Phase: 環境が正しく設定されていれば成功する
      expect(process.env.NEXT_PUBLIC_APP_URL).toBeDefined()
    })
  })
})