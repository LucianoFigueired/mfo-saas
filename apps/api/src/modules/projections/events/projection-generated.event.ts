export class ProjectionGeneratedEvent {
  constructor(
    public readonly simulationId: string,
    public readonly userId: string,
    public readonly results: any[],
    public readonly metadata: {
      name: string;
      baseTax: number;
      status: string;
    },
  ) {}
}
