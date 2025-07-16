// ===================================
// Issue #29: GitHub データ正規化 - TDD Green Phase
// ===================================
// GitHub API レスポンスから raw_content テーブル用データに変換

import crypto from "crypto";
import { GitHubRepositoryData } from "./api-client";

export interface NormalizedContent {
  user_id: string;
  source_id?: string;
  title: string;
  content: string;
  url: string;
  metadata: Record<string, any>;
  content_hash: string;
  source_type: "github";
  expires_at: Date;
}

export interface ContentStats {
  totalItems: number;
  contentTypes: Record<string, number>;
  averageSize: number;
  duplicatesRemoved: number;
}

export class GitHubDataNormalizer {
  private readonly maxContentLength: number;
  private readonly contentExpiryDays: number;

  constructor(
    options: {
      maxContentLength?: number;
      contentExpiryDays?: number;
    } = {},
  ) {
    this.maxContentLength = options.maxContentLength || 50000; // 50KB
    this.contentExpiryDays = options.contentExpiryDays || 30;
  }

  /**
   * GitHubリポジトリデータを正規化
   */
  async normalizeRepositoryData(
    repositoryData: { repositories: GitHubRepositoryData[] },
    userId: string,
    sourceId?: string,
  ): Promise<NormalizedContent[]> {
    const normalizedItems: NormalizedContent[] = [];

    if (!repositoryData.repositories) {
      return normalizedItems;
    }

    for (const repo of repositoryData.repositories) {
      try {
        // 1. リポジトリ基本情報
        const repoInfo = await this.normalizeRepositoryInfo(
          repo,
          userId,
          sourceId,
        );
        normalizedItems.push(repoInfo);

        // 2. README
        if (repo.readme?.text) {
          const readmeInfo = await this.normalizeReadme(repo, userId, sourceId);
          normalizedItems.push(readmeInfo);
        }

        // 3. Issues
        if (repo.issues?.edges?.length > 0) {
          const issueItems = await this.normalizeIssues(repo, userId, sourceId);
          normalizedItems.push(...issueItems);
        }

        // 4. Pull Requests
        if (repo.pullRequests?.edges?.length > 0) {
          const prItems = await this.normalizePullRequests(
            repo,
            userId,
            sourceId,
          );
          normalizedItems.push(...prItems);
        }

        // 5. Releases
        if (repo.releases?.edges?.length > 0) {
          const releaseItems = await this.normalizeReleases(
            repo,
            userId,
            sourceId,
          );
          normalizedItems.push(...releaseItems);
        }
      } catch (error) {
        console.error(
          `Error normalizing repository ${repo.nameWithOwner}:`,
          error,
        );
        // 1つのリポジトリの失敗で全体を止めない
        continue;
      }
    }

    // 重複除去
    return this.removeDuplicates(normalizedItems);
  }

  /**
   * Markdownコンテンツのクリーニング
   */
  cleanMarkdownContent(markdown: string): string {
    if (!markdown) return "";

    let cleaned = markdown;

    // コードブロック除去（内容は保持）
    cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => {
      const content = match.replace(/```\w*\n?/, "").replace(/```$/, "");
      return content.trim();
    });

    // インラインコード
    cleaned = cleaned.replace(/`([^`]+)`/g, "$1");

    // Markdownフォーマット除去
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, "$1"); // Bold
    cleaned = cleaned.replace(/\*([^*]+)\*/g, "$1"); // Italic
    cleaned = cleaned.replace(/~~([^~]+)~~/g, "$1"); // Strikethrough
    cleaned = cleaned.replace(/#{1,6}\s+/g, ""); // Headers
    cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, ""); // List items
    cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, ""); // Numbered lists

    // リンク処理
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // [text](url) -> text
    cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1"); // Images

    // 表の処理
    cleaned = cleaned.replace(/\|[^|\n]*\|/g, ""); // Table rows
    cleaned = cleaned.replace(/^\s*\|?[-:| ]+\|?\s*$/gm, ""); // Table separators

    // 余分な空白・改行の正規化
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n"); // Multiple newlines
    cleaned = cleaned.replace(/[ \t]{2,}/g, " "); // Multiple spaces
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * 重複除去
   */
  async removeDuplicates<T extends { content: string }>(
    items: T[],
  ): Promise<T[]> {
    const seen = new Set<string>();
    const unique: T[] = [];

    for (const item of items) {
      const hash = this.generateContentHash(item.content);

      if (!seen.has(hash)) {
        seen.add(hash);
        unique.push(item);
      }
    }

    return unique;
  }

  /**
   * 大量データセットの正規化（メモリ効率対応）
   */
  async normalizeLargeDataSet(
    dataSet: Array<{
      repository: string;
      readme: string;
      issues: Array<{ title: string; body: string }>;
    }>,
  ): Promise<any[]> {
    const results: any[] = [];
    const batchSize = 100; // メモリ効率のためバッチ処理

    for (let i = 0; i < dataSet.length; i += batchSize) {
      const batch = dataSet.slice(i, i + batchSize);

      for (const item of batch) {
        // 基本的な正規化処理
        const normalizedItem = {
          repository: item.repository,
          content: this.cleanMarkdownContent(item.readme),
          issues: item.issues.map((issue) => ({
            title: issue.title,
            body: this.cleanMarkdownContent(issue.body),
          })),
        };

        results.push(normalizedItem);
      }

      // バッチ処理後にガベージコレクション誘発
      if (global.gc) {
        global.gc();
      }
    }

    return results;
  }

  /**
   * 正規化統計の取得
   */
  getStats(items: NormalizedContent[]): ContentStats {
    const contentTypes: Record<string, number> = {};
    let totalSize = 0;

    for (const item of items) {
      const type = item.metadata.data_type || "unknown";
      contentTypes[type] = (contentTypes[type] || 0) + 1;
      totalSize += item.content.length;
    }

    return {
      totalItems: items.length,
      contentTypes,
      averageSize: items.length > 0 ? Math.round(totalSize / items.length) : 0,
      duplicatesRemoved: 0, // 実装時に計算
    };
  }

  // ===================================
  // プライベート正規化メソッド
  // ===================================

  /**
   * リポジトリ基本情報の正規化
   */
  private async normalizeRepositoryInfo(
    repo: GitHubRepositoryData,
    userId: string,
    sourceId?: string,
  ): Promise<NormalizedContent> {
    const content = this.buildRepositoryContent(repo);

    return {
      user_id: userId,
      source_id: sourceId,
      title: `Repository: ${repo.nameWithOwner}`,
      content: this.truncateContent(content),
      url: `https://github.com/${repo.nameWithOwner}`,
      metadata: {
        data_type: "repository_info",
        repository: repo.nameWithOwner,
        stars: repo.stargazerCount,
        forks: repo.forkCount,
        language: repo.primaryLanguage?.name,
        updated_at: repo.updatedAt,
      },
      content_hash: this.generateContentHash(content),
      source_type: "github",
      expires_at: this.calculateExpiryDate(),
    };
  }

  /**
   * README の正規化
   */
  private async normalizeReadme(
    repo: GitHubRepositoryData,
    userId: string,
    sourceId?: string,
  ): Promise<NormalizedContent> {
    const cleanedContent = this.cleanMarkdownContent(repo.readme!.text);

    return {
      user_id: userId,
      source_id: sourceId,
      title: `README: ${repo.nameWithOwner}`,
      content: this.truncateContent(cleanedContent),
      url: `https://github.com/${repo.nameWithOwner}#readme`,
      metadata: {
        data_type: "readme",
        repository: repo.nameWithOwner,
        size_bytes: repo.readme!.byteSize,
        language: repo.primaryLanguage?.name,
      },
      content_hash: this.generateContentHash(cleanedContent),
      source_type: "github",
      expires_at: this.calculateExpiryDate(),
    };
  }

  /**
   * Issues の正規化
   */
  private async normalizeIssues(
    repo: GitHubRepositoryData,
    userId: string,
    sourceId?: string,
  ): Promise<NormalizedContent[]> {
    const items: NormalizedContent[] = [];

    for (const edge of repo.issues.edges) {
      const issue = edge.node;
      const cleanedBody = this.cleanMarkdownContent(issue.body || "");
      const content = `${issue.title}\n\n${cleanedBody}`;

      items.push({
        user_id: userId,
        source_id: sourceId,
        title: `Issue: ${issue.title}`,
        content: this.truncateContent(content),
        url: `https://github.com/${repo.nameWithOwner}/issues/${issue.id}`,
        metadata: {
          data_type: "issue",
          repository: repo.nameWithOwner,
          issue_id: issue.id,
          state: issue.state,
          created_at: issue.createdAt,
          updated_at: issue.updatedAt,
        },
        content_hash: this.generateContentHash(content),
        source_type: "github",
        expires_at: this.calculateExpiryDate(),
      });
    }

    return items;
  }

  /**
   * Pull Requests の正規化
   */
  private async normalizePullRequests(
    repo: GitHubRepositoryData,
    userId: string,
    sourceId?: string,
  ): Promise<NormalizedContent[]> {
    const items: NormalizedContent[] = [];

    for (const edge of repo.pullRequests.edges) {
      const pr = edge.node;
      const cleanedBody = this.cleanMarkdownContent(pr.body || "");
      const content = `${pr.title}\n\n${cleanedBody}`;

      items.push({
        user_id: userId,
        source_id: sourceId,
        title: `Pull Request: ${pr.title}`,
        content: this.truncateContent(content),
        url: `https://github.com/${repo.nameWithOwner}/pull/${pr.id}`,
        metadata: {
          data_type: "pull_request",
          repository: repo.nameWithOwner,
          pr_id: pr.id,
          state: pr.state,
          created_at: pr.createdAt,
          updated_at: pr.updatedAt,
        },
        content_hash: this.generateContentHash(content),
        source_type: "github",
        expires_at: this.calculateExpiryDate(),
      });
    }

    return items;
  }

  /**
   * Releases の正規化
   */
  private async normalizeReleases(
    repo: GitHubRepositoryData,
    userId: string,
    sourceId?: string,
  ): Promise<NormalizedContent[]> {
    const items: NormalizedContent[] = [];

    for (const edge of repo.releases.edges) {
      const release = edge.node;
      const cleanedDescription = this.cleanMarkdownContent(
        release.description || "",
      );
      const content = `${release.name}\n\n${cleanedDescription}`;

      items.push({
        user_id: userId,
        source_id: sourceId,
        title: `Release: ${release.name} (${release.tagName})`,
        content: this.truncateContent(content),
        url: `https://github.com/${repo.nameWithOwner}/releases/tag/${release.tagName}`,
        metadata: {
          data_type: "release",
          repository: repo.nameWithOwner,
          release_id: release.id,
          tag_name: release.tagName,
          created_at: release.createdAt,
        },
        content_hash: this.generateContentHash(content),
        source_type: "github",
        expires_at: this.calculateExpiryDate(),
      });
    }

    return items;
  }

  // ===================================
  // ユーティリティメソッド
  // ===================================

  /**
   * リポジトリ情報のコンテンツ構築
   */
  private buildRepositoryContent(repo: GitHubRepositoryData): string {
    const parts: string[] = [];

    parts.push(`Repository: ${repo.nameWithOwner}`);

    if (repo.description) {
      parts.push(`Description: ${repo.description}`);
    }

    parts.push(`Stars: ${repo.stargazerCount}`);
    parts.push(`Forks: ${repo.forkCount}`);

    if (repo.primaryLanguage) {
      parts.push(`Primary Language: ${repo.primaryLanguage.name}`);
    }

    parts.push(`Last Updated: ${repo.updatedAt}`);

    return parts.join("\n");
  }

  /**
   * コンテンツハッシュ生成
   */
  private generateContentHash(content: string): string {
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  /**
   * コンテンツ長制限
   */
  private truncateContent(content: string): string {
    if (content.length <= this.maxContentLength) {
      return content;
    }

    // 単語境界で切り詰め
    const truncated = content.substring(0, this.maxContentLength);
    const lastSpace = truncated.lastIndexOf(" ");

    if (lastSpace > this.maxContentLength * 0.8) {
      return truncated.substring(0, lastSpace) + "...";
    }

    return truncated + "...";
  }

  /**
   * 有効期限計算
   */
  private calculateExpiryDate(): Date {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + this.contentExpiryDays);
    return expiry;
  }
}
