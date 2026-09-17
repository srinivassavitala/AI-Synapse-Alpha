export class Email {
  private constructor(private readonly value: string) {}

  static create(raw: string): Email {
    const normalized = raw.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new Error('Invalid email address');
    }
    return new Email(normalized);
  }

  toString(): string {
    return this.value;
  }
}

export class WorkspaceSlug {
  private constructor(private readonly value: string) {}

  static fromName(name: string): WorkspaceSlug {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48);
    if (!slug) throw new Error('Invalid workspace name');
    return new WorkspaceSlug(slug);
  }

  toString(): string {
    return this.value;
  }
}

export class TokenCount {
  private constructor(private readonly value: number) {}

  static fromText(text: string): TokenCount {
    return new TokenCount(Math.ceil(text.length / 4));
  }

  get valueOf(): number {
    return this.value;
  }
}
