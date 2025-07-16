// ===================================
// Issue #29: GitHub レート制限管理 - TDD Green Phase
// ===================================
// GitHub Free アカウント（5,000リクエスト/時間）対応

export interface RateLimiterConfig {
  maxRequestsPerHour: number;
  warningThreshold: number;
  resetInterval?: number; // milliseconds
}

export interface RateLimitStatus {
  remaining: number;
  resetAt: Date;
  used: number;
  warningLevel: boolean;
}

export class GitHubRateLimiter {
  private config: RateLimiterConfig;
  private requestCount: number = 0;
  private resetTime: Date;
  // private lastRequestTime: Date = new Date();

  constructor(config: RateLimiterConfig) {
    this.config = {
      resetInterval: 60 * 60 * 1000, // 1時間（デフォルト）
      ...config,
    };

    // 次のリセット時間を設定（1時間後）
    this.resetTime = new Date(Date.now() + this.config.resetInterval!);

    // 自動リセットタイマー設定
    this.startResetTimer();
  }

  /**
   * リクエスト実行可能かチェック
   */
  canMakeRequest(): boolean {
    this.checkReset();
    return this.requestCount < this.config.maxRequestsPerHour;
  }

  /**
   * リクエスト記録
   */
  recordRequest(): void {
    this.checkReset();

    if (!this.canMakeRequest()) {
      throw new Error(
        `Rate limit exceeded. Remaining: ${this.getRemainingRequests()}, Reset at: ${this.resetTime.toISOString()}`,
      );
    }

    this.requestCount++;
    // this.lastRequestTime = new Date();
  }

  /**
   * 残りリクエスト数取得
   */
  getRemainingRequests(): number {
    this.checkReset();
    return Math.max(0, this.config.maxRequestsPerHour - this.requestCount);
  }

  /**
   * リセット時間取得
   */
  getResetTime(): Date {
    return this.resetTime;
  }

  /**
   * 警告レベルかチェック
   */
  isWarningLevel(): boolean {
    const usedPercentage = this.requestCount / this.config.maxRequestsPerHour;
    return usedPercentage >= this.config.warningThreshold;
  }

  /**
   * 現在のステータス取得
   */
  getStatus(): RateLimitStatus {
    this.checkReset();

    return {
      remaining: this.getRemainingRequests(),
      resetAt: this.resetTime,
      used: this.requestCount,
      warningLevel: this.isWarningLevel(),
    };
  }

  /**
   * GitHub API レスポンスからレート制限情報を更新
   */
  updateFromResponse(response: { remaining: number; resetAt: Date }): void {
    // GitHub APIからの実際のレート制限情報で更新
    const actualUsed = this.config.maxRequestsPerHour - response.remaining;

    // 実際の値が現在の記録と大きく異なる場合は同期
    if (Math.abs(actualUsed - this.requestCount) > 10) {
      this.requestCount = actualUsed;
      this.resetTime = response.resetAt;
    }
  }

  /**
   * API呼び出し間隔の最適化計算
   */
  calculateOptimalDelay(totalUsers: number): number {
    const remainingTime = this.resetTime.getTime() - Date.now();
    const remainingRequests = this.getRemainingRequests();

    // 必要なAPI呼び出し数を推定
    const estimatedApiCalls = totalUsers * 2; // ユーザーあたり平均2コール

    if (estimatedApiCalls <= remainingRequests) {
      // 余裕がある場合は最小遅延
      return Math.max(100, Math.floor(remainingTime / estimatedApiCalls / 10));
    }

    // 制限に近い場合は均等分散
    return Math.max(1000, Math.floor(remainingTime / remainingRequests));
  }

  /**
   * バッチ処理用の最適なユーザー分割数計算
   */
  calculateOptimalBatchSize(
    totalUsers: number,
    apiCallsPerUser: number,
  ): {
    batchSize: number;
    numberOfBatches: number;
    delayBetweenBatches: number;
  } {
    const remainingRequests = this.getRemainingRequests();
    const totalApiCalls = totalUsers * apiCallsPerUser;

    if (totalApiCalls <= remainingRequests) {
      // 一度に全ユーザー処理可能
      return {
        batchSize: totalUsers,
        numberOfBatches: 1,
        delayBetweenBatches: 0,
      };
    }

    // バッチ分割が必要
    const maxUsersPerBatch = Math.floor(remainingRequests / apiCallsPerUser);
    const numberOfBatches = Math.ceil(totalUsers / maxUsersPerBatch);
    const remainingTime = this.resetTime.getTime() - Date.now();

    return {
      batchSize: maxUsersPerBatch,
      numberOfBatches,
      delayBetweenBatches: Math.floor(remainingTime / numberOfBatches),
    };
  }

  /**
   * 次回実行可能時間の計算
   */
  getNextAvailableTime(requiredRequests: number = 1): Date | null {
    if (this.getRemainingRequests() >= requiredRequests) {
      return new Date(); // 即座に実行可能
    }

    // リセット後に実行可能
    return this.resetTime;
  }

  /**
   * レート制限情報のログ出力
   */
  logStatus(): void {
    const status = this.getStatus();
    const percentage = (
      (status.used / this.config.maxRequestsPerHour) *
      100
    ).toFixed(1);

    console.log(`GitHub Rate Limit Status:
      Used: ${status.used}/${this.config.maxRequestsPerHour} (${percentage}%)
      Remaining: ${status.remaining}
      Reset at: ${status.resetAt.toISOString()}
      Warning: ${status.warningLevel ? "YES" : "NO"}
    `);
  }

  // ===================================
  // プライベートメソッド
  // ===================================

  /**
   * リセット時間チェックと実行
   */
  private checkReset(): void {
    const now = new Date();

    if (now >= this.resetTime) {
      this.resetCounter();
    }
  }

  /**
   * カウンターリセット
   */
  private resetCounter(): void {
    this.requestCount = 0;
    this.resetTime = new Date(Date.now() + this.config.resetInterval!);

    console.log(
      `GitHub rate limit reset. Next reset: ${this.resetTime.toISOString()}`,
    );
  }

  /**
   * 自動リセットタイマー開始
   */
  private startResetTimer(): void {
    const resetIn = this.resetTime.getTime() - Date.now();

    if (resetIn > 0) {
      setTimeout(() => {
        this.resetCounter();
        this.startResetTimer(); // 次のタイマー設定
      }, resetIn);
    }
  }
}

/**
 * 複数のレート制限管理（将来の拡張用）
 */
export class MultiRateLimiter {
  private limiters: Map<string, GitHubRateLimiter> = new Map();

  constructor(configs: Record<string, RateLimiterConfig>) {
    for (const [key, config] of Object.entries(configs)) {
      this.limiters.set(key, new GitHubRateLimiter(config));
    }
  }

  canMakeRequest(limiterKey: string): boolean {
    const limiter = this.limiters.get(limiterKey);
    return limiter ? limiter.canMakeRequest() : false;
  }

  recordRequest(limiterKey: string): void {
    const limiter = this.limiters.get(limiterKey);
    if (limiter) {
      limiter.recordRequest();
    }
  }

  getStatus(limiterKey: string): RateLimitStatus | null {
    const limiter = this.limiters.get(limiterKey);
    return limiter ? limiter.getStatus() : null;
  }

  getAllStatuses(): Record<string, RateLimitStatus> {
    const statuses: Record<string, RateLimitStatus> = {};

    for (const [key, limiter] of this.limiters) {
      statuses[key] = limiter.getStatus();
    }

    return statuses;
  }
}

/**
 * レート制限統計収集
 */
export class RateLimitAnalytics {
  private requestHistory: Array<{
    timestamp: Date;
    requests: number;
    remaining: number;
  }> = [];

  recordSnapshot(status: RateLimitStatus): void {
    this.requestHistory.push({
      timestamp: new Date(),
      requests: status.used,
      remaining: status.remaining,
    });

    // 過去24時間のデータのみ保持
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.requestHistory = this.requestHistory.filter(
      (record) => record.timestamp > cutoff,
    );
  }

  getUsageAnalytics(): {
    averageRequestsPerHour: number;
    peakUsage: number;
    usagePattern: Array<{ hour: number; requests: number }>;
    efficiency: number;
  } {
    if (this.requestHistory.length === 0) {
      return {
        averageRequestsPerHour: 0,
        peakUsage: 0,
        usagePattern: [],
        efficiency: 0,
      };
    }

    // 時間別使用量集計
    const hourlyUsage = new Map<number, number>();

    for (const record of this.requestHistory) {
      const hour = record.timestamp.getHours();
      hourlyUsage.set(hour, (hourlyUsage.get(hour) || 0) + record.requests);
    }

    const usageValues = Array.from(hourlyUsage.values());
    const averageRequestsPerHour =
      usageValues.reduce((a, b) => a + b, 0) / usageValues.length;
    const peakUsage = Math.max(...usageValues);

    const usagePattern = Array.from(hourlyUsage.entries()).map(
      ([hour, requests]) => ({
        hour,
        requests,
      }),
    );

    // 効率性計算（制限内でどれだけ活用できているか）
    const maxPossible = 5000; // GitHub Free制限
    const efficiency = (averageRequestsPerHour / maxPossible) * 100;

    return {
      averageRequestsPerHour,
      peakUsage,
      usagePattern,
      efficiency,
    };
  }
}
