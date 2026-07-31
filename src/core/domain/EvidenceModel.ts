export interface BaseEvidence {
  source: 'filesystem' | 'registry' | 'service' | 'task' | 'hosts' | 'process' | 'event' | 'license';
  confidence: number; // 0 to 100
  timestamp: number;
  rawData: any;
}

export interface FileEvidence extends BaseEvidence {
  source: 'filesystem';
  path: string;
  exists: boolean;
  size?: number;
  sha256?: string;
}

export interface RegistryEvidence extends BaseEvidence {
  source: 'registry';
  hive: string;
  key: string;
  valueName?: string;
  value?: string;
  exists: boolean;
}

export interface HostEvidence extends BaseEvidence {
  source: 'hosts';
  ip: string;
  hostname: string;
  lineNumber: number;
  suspicious: boolean;
}

export interface ServiceEvidence extends BaseEvidence {
  source: 'service';
  name: string;
  displayName: string;
  status: string;
  startMode: string;
  suspicious: boolean;
}

export interface TaskEvidence extends BaseEvidence {
  source: 'task';
  name: string;
  path: string;
  action: string;
  suspicious: boolean;
}

export interface ProcessEvidence extends BaseEvidence {
  source: 'process';
  pid: number;
  name: string;
  path: string;
  suspicious: boolean;
}

export interface EventEvidence extends BaseEvidence {
  source: 'event';
  eventId: number;
  logName: string;
  timeCreated: string;
  message: string;
}

export interface LicenseEvidence extends BaseEvidence {
  source: 'license';
  productName: string;
  status: number;
  channel: string;
  kmsHost?: string;
  kmsPort?: number;
  hasOA3Key: boolean;
  oa3Key?: string;
  isGenericKey: boolean;
}

export type StructuredEvidence =
  | FileEvidence
  | RegistryEvidence
  | HostEvidence
  | ServiceEvidence
  | TaskEvidence
  | ProcessEvidence
  | EventEvidence
  | LicenseEvidence;
