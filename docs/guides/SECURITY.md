# Security Requirements & Guidelines 🔒

## Table of Contents
- [Security Overview](#security-overview)
- [Authentication & Authorization](#authentication--authorization)
- [Data Protection](#data-protection)
- [Payment Security](#payment-security)
- [API Security](#api-security)
- [Infrastructure Security](#infrastructure-security)
- [Compliance Requirements](#compliance-requirements)
- [Security Monitoring](#security-monitoring)
- [Incident Response](#incident-response)

## Security Overview

### Security Principles
1. **Defense in Depth** - Multiple layers of security controls
2. **Zero Trust** - Never trust, always verify
3. **Least Privilege** - Minimum necessary access rights
4. **Data Minimization** - Collect and store only what's necessary
5. **Privacy by Design** - Build privacy into every system component
6. **Secure by Default** - Systems should be secure out of the box

### Security Threat Model
```typescript
enum ThreatLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

interface SecurityThreat {
  id: string;
  name: string;
  description: string;
  level: ThreatLevel;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high' | 'critical';
  mitigations: string[];
  monitoring: string[];
}

const SECURITY_THREATS: SecurityThreat[] = [
  {
    id: 'AUTH_BYPASS',
    name: 'Authentication Bypass',
    description: 'Unauthorized access to user accounts',
    level: ThreatLevel.CRITICAL,
    likelihood: 'medium',
    impact: 'critical',
    mitigations: [
      'Multi-factor authentication',
      'Strong password policies',
      'Account lockout mechanisms',
      'JWT token security',
    ],
    monitoring: [
      'Failed login attempts',
      'Unusual login patterns',
      'Token validation failures',
    ],
  },
  {
    id: 'PAYMENT_FRAUD',
    name: 'Payment Fraud',
    description: 'Fraudulent payment transactions',
    level: ThreatLevel.CRITICAL,
    likelihood: 'high',
    impact: 'critical',
    mitigations: [
      'Real-time fraud detection',
      'Transaction limits',
      'KYC/AML verification',
      'Behavioral analysis',
    ],
    monitoring: [
      'Suspicious transaction patterns',
      'Velocity checks',
      'Device fingerprinting',
    ],
  },
  {
    id: 'DATA_BREACH',
    name: 'Data Breach',
    description: 'Unauthorized access to sensitive data',
    level: ThreatLevel.CRITICAL,
    likelihood: 'medium',
    impact: 'critical',
    mitigations: [
      'End-to-end encryption',
      'Access controls',
      'Data masking',
      'Secure storage',
    ],
    monitoring: [
      'Data access patterns',
      'Failed authorization attempts',
      'Data export activities',
    ],
  },
];
```

## Authentication & Authorization

### Multi-Factor Authentication (MFA)
```typescript
interface MFAService {
  // MFA setup and management
  enableMFA(userId: string, method: MFAMethod): Promise<MFASetup>;
  disableMFA(userId: string, verificationCode: string): Promise<void>;
  verifyMFA(userId: string, code: string): Promise<boolean>;
  generateBackupCodes(userId: string): Promise<string[]>;
  
  // MFA methods
  setupTOTP(userId: string): Promise<TOTPSetup>;
  setupSMS(userId: string, phoneNumber: string): Promise<SMSSetup>;
  setupEmail(userId: string, email: string): Promise<EmailSetup>;
}

enum MFAMethod {
  TOTP = 'totp',
  SMS = 'sms',
  EMAIL = 'email',
  PUSH = 'push',
}

interface MFASetup {
  method: MFAMethod;
  secret: string;
  qrCode?: string;
  backupCodes: string[];
  verificationRequired: boolean;
}

class MFAManager implements MFAService {
  constructor(
    private cryptoService: CryptoService,
    private smsService: SMSService,
    private emailService: EmailService
  ) {}

  async enableMFA(userId: string, method: MFAMethod): Promise<MFASetup> {
    // Verify user is authenticated
    const user = await this.userService.getUser(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    switch (method) {
      case MFAMethod.TOTP:
        return this.setupTOTP(userId);
      case MFAMethod.SMS:
        return this.setupSMS(userId, user.phoneNumber);
      case MFAMethod.EMAIL:
        return this.setupEmail(userId, user.email);
      default:
        throw new Error('Unsupported MFA method');
    }
  }

  async setupTOTP(userId: string): Promise<TOTPSetup> {
    // Generate secure secret
    const secret = this.cryptoService.generateSecureRandom(32);
    
    // Generate QR code for easy setup
    const qrCode = await this.generateTOTPQRCode(userId, secret);
    
    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    
    // Store MFA configuration (encrypted)
    await this.storeMFAConfig(userId, {
      method: MFAMethod.TOTP,
      secret: await this.cryptoService.encrypt(secret),
      backupCodes: await Promise.all(
        backupCodes.map(code => this.cryptoService.hash(code))
      ),
      enabled: false, // Requires verification first
    });

    return {
      method: MFAMethod.TOTP,
      secret,
      qrCode,
      backupCodes,
      verificationRequired: true,
    };
  }

  async verifyMFA(userId: string, code: string): Promise<boolean> {
    const mfaConfig = await this.getMFAConfig(userId);
    if (!mfaConfig || !mfaConfig.enabled) {
      return false;
    }

    switch (mfaConfig.method) {
      case MFAMethod.TOTP:
        return this.verifyTOTP(mfaConfig.secret, code);
      case MFAMethod.SMS:
        return this.verifySMSCode(userId, code);
      default:
        return false;
    }
  }

  private generateBackupCodes(): string[] {
    return Array.from({ length: 10 }, () => 
      this.cryptoService.generateSecureRandom(8).toString('hex')
    );
  }
}
```

### Role-Based Access Control (RBAC)
```typescript
enum UserRole {
  USER = 'user',
  MERCHANT = 'merchant', 
  OPERATOR = 'operator',
  PARTNER = 'partner',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

enum Permission {
  // User permissions
  VIEW_PROFILE = 'user:view_profile',
  UPDATE_PROFILE = 'user:update_profile',
  DELETE_PROFILE = 'user:delete_profile',
  
  // Payment permissions
  CREATE_PAYMENT = 'payment:create',
  VIEW_PAYMENT = 'payment:view',
  CANCEL_PAYMENT = 'payment:cancel',
  REFUND_PAYMENT = 'payment:refund',
  
  // Cross-border permissions
  CREATE_CROSS_BORDER = 'payment:create_cross_border',
  VIEW_EXCHANGE_RATES = 'payment:view_exchange_rates',
  
  // Admin permissions
  MANAGE_USERS = 'admin:manage_users',
  VIEW_ANALYTICS = 'admin:view_analytics',
  SYSTEM_CONFIG = 'admin:system_config',
}

interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

const ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: UserRole.USER,
    permissions: [
      Permission.VIEW_PROFILE,
      Permission.UPDATE_PROFILE,
      Permission.CREATE_PAYMENT,
      Permission.VIEW_PAYMENT,
      Permission.CANCEL_PAYMENT,
      Permission.CREATE_CROSS_BORDER,
      Permission.VIEW_EXCHANGE_RATES,
    ],
  },
  {
    role: UserRole.MERCHANT,
    permissions: [
      Permission.VIEW_PROFILE,
      Permission.UPDATE_PROFILE,
      Permission.CREATE_PAYMENT,
      Permission.VIEW_PAYMENT,
      Permission.REFUND_PAYMENT,
      Permission.VIEW_ANALYTICS,
    ],
  },
  {
    role: UserRole.ADMIN,
    permissions: [
      ...Object.values(Permission), // All permissions
    ],
  },
];

class AuthorizationService {
  async checkPermission(
    userId: string,
    permission: Permission
  ): Promise<boolean> {
    const user = await this.userService.getUser(userId);
    if (!user || !user.isActive) {
      return false;
    }

    const rolePermissions = ROLE_PERMISSIONS.find(
      rp => rp.role === user.role
    );

    return rolePermissions?.permissions.includes(permission) ?? false;
  }

  async requirePermission(
    userId: string,
    permission: Permission
  ): Promise<void> {
    const hasPermission = await this.checkPermission(userId, permission);
    if (!hasPermission) {
      throw new ForbiddenError(
        `User ${userId} does not have permission: ${permission}`
      );
    }
  }

  // Resource-based authorization
  async checkResourceAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string
  ): Promise<boolean> {
    // Check if user owns the resource
    const ownsResource = await this.checkResourceOwnership(
      userId,
      resourceType,
      resourceId
    );

    if (ownsResource) {
      return true;
    }

    // Check role-based permissions
    const permission = `${resourceType}:${action}` as Permission;
    return this.checkPermission(userId, permission);
  }

  private async checkResourceOwnership(
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<boolean> {
    switch (resourceType) {
      case 'payment':
        const payment = await this.paymentService.getPayment(resourceId);
        return payment?.userId === userId || payment?.recipientId === userId;
      
      case 'profile':
        return resourceId === userId;
      
      default:
        return false;
    }
  }
}
```

### Secure Password Management
```typescript
interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
  preventReuse: number; // Number of previous passwords to check
}

const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventReuse: 5,
};

class PasswordManager {
  private readonly saltRounds = 12;
  private readonly commonPasswords = new Set<string>(); // Load from secure source

  async hashPassword(password: string): Promise<string> {
    // Validate password against policy
    await this.validatePassword(password);
    
    // Hash with bcrypt
    return bcrypt.hash(password, this.saltRounds);
  }

  async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async validatePassword(
    password: string,
    userId?: string
  ): Promise<void> {
    const policy = DEFAULT_PASSWORD_POLICY;
    const errors: string[] = [];

    // Length validation
    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters`);
    }
    if (password.length > policy.maxLength) {
      errors.push(`Password must be at most ${policy.maxLength} characters`);
    }

    // Character requirements
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Common password check
    if (policy.preventCommonPasswords && this.isCommonPassword(password)) {
      errors.push('Password is too common, please choose a different one');
    }

    // Password reuse check
    if (userId && policy.preventReuse > 0) {
      const isReused = await this.checkPasswordReuse(userId, password, policy.preventReuse);
      if (isReused) {
        errors.push(`Password cannot be one of your last ${policy.preventReuse} passwords`);
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Password validation failed', errors);
    }
  }

  private isCommonPassword(password: string): boolean {
    return this.commonPasswords.has(password.toLowerCase());
  }

  private async checkPasswordReuse(
    userId: string,
    newPassword: string,
    checkCount: number
  ): Promise<boolean> {
    const previousPasswords = await this.getPreviousPasswordHashes(
      userId,
      checkCount
    );

    for (const previousHash of previousPasswords) {
      if (await this.verifyPassword(newPassword, previousHash)) {
        return true;
      }
    }

    return false;
  }

  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Verify current password
    const user = await this.userService.getUser(userId);
    const isCurrentValid = await this.verifyPassword(
      currentPassword,
      user.passwordHash
    );

    if (!isCurrentValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Validate new password
    await this.validatePassword(newPassword, userId);

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password and store in history
    await this.userService.updatePassword(userId, newPasswordHash);
    await this.storePasswordHistory(userId, user.passwordHash);
  }
}
```

## Data Protection

### End-to-End Encryption
```typescript
interface EncryptionService {
  encrypt(data: string, algorithm?: EncryptionAlgorithm): Promise<EncryptedData>;
  decrypt(encryptedData: EncryptedData): Promise<string>;
  generateKey(algorithm: EncryptionAlgorithm): Promise<string>;
  rotateKey(oldKeyId: string): Promise<string>;
}

enum EncryptionAlgorithm {
  AES_256_GCM = 'aes-256-gcm',
  AES_256_CBC = 'aes-256-cbc',
  CHACHA20_POLY1305 = 'chacha20-poly1305',
}

interface EncryptedData {
  algorithm: EncryptionAlgorithm;
  keyId: string;
  iv: string;
  authTag?: string;
  ciphertext: string;
}

class CryptoService implements EncryptionService {
  private keyManager: KeyManager;

  constructor(keyManager: KeyManager) {
    this.keyManager = keyManager;
  }

  async encrypt(
    data: string,
    algorithm: EncryptionAlgorithm = EncryptionAlgorithm.AES_256_GCM
  ): Promise<EncryptedData> {
    const keyId = await this.keyManager.getCurrentKeyId(algorithm);
    const key = await this.keyManager.getKey(keyId);
    const iv = crypto.randomBytes(16);

    let cipher: crypto.Cipher;
    let authTag: Buffer | undefined;

    switch (algorithm) {
      case EncryptionAlgorithm.AES_256_GCM:
        cipher = crypto.createCipher('aes-256-gcm', key);
        cipher.setAAD(Buffer.from(keyId)); // Additional authenticated data
        break;
      
      case EncryptionAlgorithm.AES_256_CBC:
        cipher = crypto.createCipher('aes-256-cbc', key);
        break;
      
      default:
        throw new Error(`Unsupported encryption algorithm: ${algorithm}`);
    }

    cipher.update(iv);
    let ciphertext = cipher.update(data, 'utf8', 'base64');
    ciphertext += cipher.final('base64');

    if (algorithm === EncryptionAlgorithm.AES_256_GCM) {
      authTag = (cipher as crypto.CipherGCM).getAuthTag();
    }

    return {
      algorithm,
      keyId,
      iv: iv.toString('base64'),
      authTag: authTag?.toString('base64'),
      ciphertext,
    };
  }

  async decrypt(encryptedData: EncryptedData): Promise<string> {
    const key = await this.keyManager.getKey(encryptedData.keyId);
    const iv = Buffer.from(encryptedData.iv, 'base64');

    let decipher: crypto.Decipher;

    switch (encryptedData.algorithm) {
      case EncryptionAlgorithm.AES_256_GCM:
        decipher = crypto.createDecipher('aes-256-gcm', key);
        decipher.setAAD(Buffer.from(encryptedData.keyId));
        if (encryptedData.authTag) {
          (decipher as crypto.DecipherGCM).setAuthTag(
            Buffer.from(encryptedData.authTag, 'base64')
          );
        }
        break;
      
      case EncryptionAlgorithm.AES_256_CBC:
        decipher = crypto.createDecipher('aes-256-cbc', key);
        break;
      
      default:
        throw new Error(`Unsupported encryption algorithm: ${encryptedData.algorithm}`);
    }

    decipher.update(iv);
    let plaintext = decipher.update(encryptedData.ciphertext, 'base64', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  }
}

// Key management with rotation
class KeyManager {
  private keys = new Map<string, Buffer>();
  private currentKeyIds = new Map<EncryptionAlgorithm, string>();

  async generateKey(algorithm: EncryptionAlgorithm): Promise<string> {
    let keyLength: number;
    
    switch (algorithm) {
      case EncryptionAlgorithm.AES_256_GCM:
      case EncryptionAlgorithm.AES_256_CBC:
        keyLength = 32; // 256 bits
        break;
      default:
        throw new Error(`Unknown algorithm: ${algorithm}`);
    }

    const key = crypto.randomBytes(keyLength);
    const keyId = this.generateKeyId();
    
    this.keys.set(keyId, key);
    this.currentKeyIds.set(algorithm, keyId);
    
    // Store key securely (e.g., in HSM or key vault)
    await this.storeKeySecurely(keyId, key);
    
    return keyId;
  }

  async rotateKey(oldKeyId: string): Promise<string> {
    // Find algorithm for old key
    const algorithm = this.findAlgorithmForKey(oldKeyId);
    
    // Generate new key
    const newKeyId = await this.generateKey(algorithm);
    
    // Schedule old key for deletion (after grace period)
    setTimeout(() => {
      this.keys.delete(oldKeyId);
    }, 24 * 60 * 60 * 1000); // 24 hours grace period
    
    return newKeyId;
  }

  async getKey(keyId: string): Promise<Buffer> {
    const key = this.keys.get(keyId);
    if (!key) {
      // Try to load from secure storage
      const loadedKey = await this.loadKeyFromStorage(keyId);
      if (loadedKey) {
        this.keys.set(keyId, loadedKey);
        return loadedKey;
      }
      throw new Error(`Key not found: ${keyId}`);
    }
    return key;
  }

  private generateKeyId(): string {
    return `key_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }
}
```

### Data Masking and Tokenization
```typescript
interface DataMaskingService {
  maskSensitiveData(data: unknown, maskingRules: MaskingRule[]): unknown;
  tokenizeSensitiveData(data: SensitiveData): Promise<TokenizedData>;
  detokenizeData(tokenizedData: TokenizedData): Promise<SensitiveData>;
}

interface MaskingRule {
  field: string;
  maskingType: MaskingType;
  preserveLength?: boolean;
  preserveFormat?: boolean;
}

enum MaskingType {
  FULL_MASK = 'full_mask',
  PARTIAL_MASK = 'partial_mask',
  HASH = 'hash',
  ENCRYPT = 'encrypt',
  TOKENIZE = 'tokenize',
}

interface SensitiveData {
  cardNumber?: string;
  ssn?: string;
  email?: string;
  phoneNumber?: string;
  bankAccount?: string;
}

interface TokenizedData {
  tokens: Record<string, string>;
  algorithm: string;
  metadata: Record<string, unknown>;
}

class DataProtectionService implements DataMaskingService {
  private tokenVault: TokenVault;
  private cryptoService: CryptoService;

  constructor(tokenVault: TokenVault, cryptoService: CryptoService) {
    this.tokenVault = tokenVault;
    this.cryptoService = cryptoService;
  }

  maskSensitiveData(data: unknown, maskingRules: MaskingRule[]): unknown {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const maskedData = { ...data as Record<string, unknown> };

    for (const rule of maskingRules) {
      const value = maskedData[rule.field];
      if (typeof value === 'string') {
        maskedData[rule.field] = this.applyMasking(value, rule);
      }
    }

    return maskedData;
  }

  private applyMasking(value: string, rule: MaskingRule): string {
    switch (rule.maskingType) {
      case MaskingType.FULL_MASK:
        return rule.preserveLength ? '*'.repeat(value.length) : '***';
      
      case MaskingType.PARTIAL_MASK:
        return this.partialMask(value, rule);
      
      case MaskingType.HASH:
        return crypto.createHash('sha256').update(value).digest('hex');
      
      default:
        return value;
    }
  }

  private partialMask(value: string, rule: MaskingRule): string {
    if (value.length <= 4) {
      return '*'.repeat(value.length);
    }

    // Show first and last 2 characters, mask the middle
    const start = value.substring(0, 2);
    const end = value.substring(value.length - 2);
    const middle = '*'.repeat(value.length - 4);
    
    return `${start}${middle}${end}`;
  }

  async tokenizeSensitiveData(data: SensitiveData): Promise<TokenizedData> {
    const tokens: Record<string, string> = {};

    for (const [field, value] of Object.entries(data)) {
      if (value) {
        tokens[field] = await this.tokenVault.tokenize(value);
      }
    }

    return {
      tokens,
      algorithm: 'vault-tokenization',
      metadata: {
        createdAt: new Date().toISOString(),
        version: '1.0',
      },
    };
  }

  async detokenizeData(tokenizedData: TokenizedData): Promise<SensitiveData> {
    const sensitiveData: SensitiveData = {};

    for (const [field, token] of Object.entries(tokenizedData.tokens)) {
      sensitiveData[field as keyof SensitiveData] = await this.tokenVault.detokenize(token);
    }

    return sensitiveData;
  }
}

// Token vault for secure tokenization
class TokenVault {
  private tokens = new Map<string, string>();
  private reverseTokens = new Map<string, string>();

  async tokenize(value: string): Promise<string> {
    // Check if value is already tokenized
    const existingToken = this.reverseTokens.get(value);
    if (existingToken) {
      return existingToken;
    }

    // Generate secure token
    const token = this.generateSecureToken();
    
    // Store bidirectional mapping
    this.tokens.set(token, value);
    this.reverseTokens.set(value, token);
    
    // Persist to secure storage
    await this.persistToken(token, value);
    
    return token;
  }

  async detokenize(token: string): Promise<string> {
    const value = this.tokens.get(token);
    if (!value) {
      // Try to load from secure storage
      const loadedValue = await this.loadTokenValue(token);
      if (loadedValue) {
        this.tokens.set(token, loadedValue);
        return loadedValue;
      }
      throw new Error(`Invalid token: ${token}`);
    }
    return value;
  }

  private generateSecureToken(): string {
    // Generate cryptographically secure token
    const randomBytes = crypto.randomBytes(16);
    return `tok_${randomBytes.toString('hex')}`;
  }

  private async persistToken(token: string, value: string): Promise<void> {
    // Encrypt value before storing
    const encryptedValue = await this.cryptoService.encrypt(value);
    
    // Store in secure token vault (database, HSM, etc.)
    await this.secureStorage.store(token, encryptedValue);
  }
}
```

## Payment Security

### PCI DSS Compliance Implementation
```typescript
interface PCIDSSCompliance {
  // Requirement 1: Install and maintain a firewall configuration
  configureFirewall(): Promise<void>;
  
  // Requirement 2: Do not use vendor-supplied defaults for system passwords
  changeDefaultPasswords(): Promise<void>;
  
  // Requirement 3: Protect stored cardholder data
  protectCardholderData(data: CardholderData): Promise<ProtectedData>;
  
  // Requirement 4: Encrypt transmission of cardholder data across open networks
  encryptDataTransmission(data: unknown): Promise<EncryptedTransmission>;
  
  // Requirement 5: Protect all systems against malware
  deployAntiMalware(): Promise<void>;
  
  // Requirement 6: Develop and maintain secure systems and applications
  secureSystemDevelopment(): Promise<void>;
  
  // Requirement 7: Restrict access to cardholder data by business need to know
  restrictDataAccess(userId: string, dataType: string): Promise<boolean>;
  
  // Requirement 8: Identify and authenticate access to system components
  authenticateAccess(credentials: AuthCredentials): Promise<AuthResult>;
  
  // Requirement 9: Restrict physical access to cardholder data
  restrictPhysicalAccess(): Promise<void>;
  
  // Requirement 10: Track and monitor all access to network resources and cardholder data
  auditDataAccess(action: AuditAction): Promise<void>;
  
  // Requirement 11: Regularly test security systems and processes
  performSecurityTesting(): Promise<SecurityTestResult>;
  
  // Requirement 12: Maintain a policy that addresses information security
  maintainSecurityPolicy(): Promise<void>;
}

interface CardholderData {
  primaryAccountNumber: string; // PAN
  cardholderName: string;
  expirationDate: string;
  serviceCode?: string;
  // Note: CVV/CVC should NEVER be stored
}

interface ProtectedData {
  tokenizedPAN: string;
  encryptedCardholderName: string;
  maskedPAN: string; // Only first 6 and last 4 digits
  expirationDate: string; // Can be stored if needed for processing
}

class PCIDSSService implements PCIDSSCompliance {
  constructor(
    private tokenVault: TokenVault,
    private cryptoService: CryptoService,
    private auditLogger: AuditLogger
  ) {}

  // Requirement 3: Protect stored cardholder data
  async protectCardholderData(data: CardholderData): Promise<ProtectedData> {
    // Validate that CVV is not present (should never be stored)
    this.validateNoSensitiveAuthData(data);

    // Tokenize PAN
    const tokenizedPAN = await this.tokenVault.tokenize(data.primaryAccountNumber);
    
    // Encrypt cardholder name
    const encryptedCardholderName = await this.cryptoService.encrypt(
      data.cardholderName,
      EncryptionAlgorithm.AES_256_GCM
    );
    
    // Create masked PAN (first 6 and last 4 digits)
    const maskedPAN = this.maskPAN(data.primaryAccountNumber);
    
    // Audit the data protection action
    await this.auditLogger.log({
      action: 'cardholder_data_protected',
      timestamp: new Date(),
      details: {
        tokenizedPAN,
        maskedPAN,
      },
    });

    return {
      tokenizedPAN,
      encryptedCardholderName: JSON.stringify(encryptedCardholderName),
      maskedPAN,
      expirationDate: data.expirationDate,
    };
  }

  // Requirement 4: Encrypt transmission of cardholder data
  async encryptDataTransmission(data: unknown): Promise<EncryptedTransmission> {
    // Use TLS 1.3 for transmission encryption
    const encryptedPayload = await this.cryptoService.encrypt(
      JSON.stringify(data),
      EncryptionAlgorithm.AES_256_GCM
    );

    // Generate transmission integrity hash
    const integrityHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(encryptedPayload))
      .digest('hex');

    return {
      encryptedPayload,
      integrityHash,
      timestamp: new Date().toISOString(),
      protocol: 'TLS_1_3',
    };
  }

  // Requirement 7: Restrict access to cardholder data
  async restrictDataAccess(userId: string, dataType: string): Promise<boolean> {
    // Check user's business need to know
    const user = await this.userService.getUser(userId);
    if (!user) return false;

    // Define data access rules based on role
    const accessRules: Record<string, string[]> = {
      [UserRole.USER]: [], // Users cannot access raw cardholder data
      [UserRole.MERCHANT]: ['masked_pan', 'transaction_data'],
      [UserRole.OPERATOR]: ['masked_pan'],
      [UserRole.PARTNER]: ['transaction_data'],
      [UserRole.ADMIN]: ['masked_pan', 'transaction_data', 'audit_logs'],
      [UserRole.SUPER_ADMIN]: ['full_cardholder_data'], // Very restricted
    };

    const allowedDataTypes = accessRules[user.role] || [];
    const hasAccess = allowedDataTypes.includes(dataType);

    // Audit access attempt
    await this.auditLogger.log({
      action: 'cardholder_data_access_attempt',
      userId,
      dataType,
      allowed: hasAccess,
      timestamp: new Date(),
    });

    return hasAccess;
  }

  // Requirement 10: Track and monitor all access
  async auditDataAccess(action: AuditAction): Promise<void> {
    await this.auditLogger.log({
      ...action,
      timestamp: new Date(),
      source: 'pci_dss_compliance',
    });

    // Real-time alerting for sensitive actions
    if (this.isSensitiveAction(action)) {
      await this.securityAlertService.sendAlert({
        type: 'sensitive_data_access',
        severity: 'high',
        details: action,
      });
    }
  }

  private validateNoSensitiveAuthData(data: CardholderData): void {
    // Ensure CVV/CVC is not present
    const sensitiveFields = ['cvv', 'cvc', 'cid', 'pin'];
    const dataObj = data as unknown as Record<string, unknown>;
    
    for (const field of sensitiveFields) {
      if (field in dataObj) {
        throw new Error(`Sensitive authentication data found: ${field}. This data must not be stored.`);
      }
    }
  }

  private maskPAN(pan: string): string {
    if (pan.length < 10) {
      throw new Error('Invalid PAN length');
    }

    const first6 = pan.substring(0, 6);
    const last4 = pan.substring(pan.length - 4);
    const middle = '*'.repeat(pan.length - 10);
    
    return `${first6}${middle}${last4}`;
  }

  private isSensitiveAction(action: AuditAction): boolean {
    const sensitiveActions = [
      'cardholder_data_access',
      'full_pan_access',
      'bulk_data_export',
      'admin_override',
    ];

    return sensitiveActions.includes(action.action);
  }
}
```

### Fraud Detection System
```typescript
interface FraudDetectionService {
  analyzeTransaction(transaction: Transaction): Promise<FraudAnalysis>;
  updateRiskProfile(userId: string, riskFactors: RiskFactor[]): Promise<void>;
  blockSuspiciousActivity(userId: string, reason: string): Promise<void>;
  reviewFlaggedTransaction(transactionId: string): Promise<ReviewResult>;
}

interface FraudAnalysis {
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  triggers: FraudTrigger[];
  recommendedAction: FraudAction;
  confidence: number;
}

enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

enum FraudAction {
  ALLOW = 'allow',
  REQUIRE_MFA = 'require_mfa',
  MANUAL_REVIEW = 'manual_review',
  BLOCK = 'block',
}

interface FraudTrigger {
  type: string;
  description: string;
  weight: number;
  evidence: Record<string, unknown>;
}

class FraudDetectionEngine implements FraudDetectionService {
  private riskRules: FraudRule[];
  private mlModel: MachineLearningModel;

  constructor(
    private userService: UserService,
    private transactionService: TransactionService,
    private geolocationService: GeolocationService
  ) {
    this.initializeRiskRules();
  }

  async analyzeTransaction(transaction: Transaction): Promise<FraudAnalysis> {
    const triggers: FraudTrigger[] = [];
    let totalRiskScore = 0;

    // Run all fraud detection rules
    for (const rule of this.riskRules) {
      const result = await rule.evaluate(transaction);
      if (result.triggered) {
        triggers.push({
          type: rule.type,
          description: rule.description,
          weight: rule.weight,
          evidence: result.evidence,
        });
        totalRiskScore += rule.weight;
      }
    }

    // Machine learning risk assessment
    const mlRiskScore = await this.mlModel.predictRisk(transaction);
    totalRiskScore += mlRiskScore;

    // Determine risk level and action
    const riskLevel = this.calculateRiskLevel(totalRiskScore);
    const recommendedAction = this.determineAction(riskLevel, triggers);

    // Log fraud analysis
    await this.auditLogger.log({
      action: 'fraud_analysis_completed',
      transactionId: transaction.id,
      riskScore: totalRiskScore,
      riskLevel,
      triggersCount: triggers.length,
      timestamp: new Date(),
    });

    return {
      riskScore: Math.min(totalRiskScore, 100),
      riskLevel,
      triggers,
      recommendedAction,
      confidence: await this.calculateConfidence(triggers, mlRiskScore),
    };
  }

  private initializeRiskRules(): void {
    this.riskRules = [
      // Velocity rules
      new VelocityRule({
        type: 'high_frequency',
        description: 'Multiple transactions in short time period',
        weight: 25,
        maxTransactions: 5,
        timeWindow: 60 * 1000, // 1 minute
      }),

      // Amount rules
      new AmountRule({
        type: 'unusual_amount',
        description: 'Transaction amount significantly higher than user average',
        weight: 20,
        multiplierThreshold: 5,
      }),

      // Geolocation rules
      new GeolocationRule({
        type: 'location_anomaly',
        description: 'Transaction from unusual location',
        weight: 30,
        maxDistanceKm: 1000,
      }),

      // Time-based rules
      new TimeRule({
        type: 'unusual_time',
        description: 'Transaction at unusual time for user',
        weight: 15,
      }),

      // Device rules
      new DeviceRule({
        type: 'unknown_device',
        description: 'Transaction from unrecognized device',
        weight: 25,
      }),

      // Cross-border specific rules
      new CrossBorderRule({
        type: 'high_risk_country',
        description: 'Transaction to high-risk country',
        weight: 35,
        highRiskCountries: ['XX', 'YY'], // ISO country codes
      }),
    ];
  }

  private calculateRiskLevel(riskScore: number): RiskLevel {
    if (riskScore >= 80) return RiskLevel.CRITICAL;
    if (riskScore >= 60) return RiskLevel.HIGH;
    if (riskScore >= 30) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  private determineAction(riskLevel: RiskLevel, triggers: FraudTrigger[]): FraudAction {
    switch (riskLevel) {
      case RiskLevel.CRITICAL:
        return FraudAction.BLOCK;
      case RiskLevel.HIGH:
        return FraudAction.MANUAL_REVIEW;
      case RiskLevel.MEDIUM:
        return FraudAction.REQUIRE_MFA;
      default:
        return FraudAction.ALLOW;
    }
  }

  async blockSuspiciousActivity(userId: string, reason: string): Promise<void> {
    // Temporarily block user account
    await this.userService.updateUser(userId, {
      status: 'temporarily_blocked',
      blockReason: reason,
      blockedAt: new Date(),
    });

    // Send immediate notification to security team
    await this.securityAlertService.sendAlert({
      type: 'account_blocked',
      severity: 'critical',
      userId,
      reason,
      timestamp: new Date(),
    });

    // Notify user via secure channel
    await this.notificationService.sendSecureNotification(userId, {
      type: 'account_security_alert',
      message: 'Your account has been temporarily blocked due to suspicious activity.',
      actionRequired: 'Please contact support to verify your identity.',
    });
  }
}

// Example fraud rule implementation
class VelocityRule implements FraudRule {
  constructor(private config: VelocityRuleConfig) {}

  async evaluate(transaction: Transaction): Promise<RuleResult> {
    const recentTransactions = await this.transactionService.getRecentTransactions(
      transaction.userId,
      this.config.timeWindow
    );

    if (recentTransactions.length >= this.config.maxTransactions) {
      return {
        triggered: true,
        evidence: {
          transactionCount: recentTransactions.length,
          timeWindow: this.config.timeWindow,
          threshold: this.config.maxTransactions,
        },
      };
    }

    return { triggered: false, evidence: {} };
  }

  get type(): string { return this.config.type; }
  get description(): string { return this.config.description; }
  get weight(): number { return this.config.weight; }
}
```

## API Security

### Input Validation and Sanitization
```typescript
class SecurityValidator {
  // SQL injection prevention
  sanitizeInput(input: unknown): unknown {
    if (typeof input === 'string') {
      return this.sanitizeString(input);
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[this.sanitizeKey(key)] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  private sanitizeString(input: string): string {
    // Remove or escape dangerous characters
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/['"]/g, '&quot;') // Escape quotes
      .replace(/[;--]/g, '') // Remove SQL comment patterns
      .trim();
  }

  private sanitizeKey(key: string): string {
    // Only allow alphanumeric and underscore in object keys
    return key.replace(/[^a-zA-Z0-9_]/g, '');
  }

  // XSS prevention
  escapeHtml(input: string): string {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    return input.replace(/[&<>"'/]/g, char => htmlEscapes[char]);
  }

  // CSRF token validation
  async validateCSRFToken(request: Request): Promise<void> {
    const tokenFromHeader = request.headers.get('X-CSRF-Token');
    const tokenFromCookie = this.extractCSRFTokenFromCookie(request);

    if (!tokenFromHeader || !tokenFromCookie) {
      throw new SecurityError('CSRF token missing');
    }

    if (!this.constantTimeCompare(tokenFromHeader, tokenFromCookie)) {
      throw new SecurityError('CSRF token mismatch');
    }
  }

  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }
}
```

### API Security Headers
```typescript
class SecurityHeaders {
  static setSecurityHeaders(response: Response): void {
    // Prevent XSS attacks
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https://api.paypass.com; " +
      "frame-ancestors 'none'"
    );

    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // Enable XSS protection
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'DENY');

    // Force HTTPS
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );

    // Control referrer information
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Prevent caching of sensitive data
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    // Remove server information
    response.headers.delete('Server');
    response.headers.delete('X-Powered-By');
  }
}
```

## Infrastructure Security

### Container Security
```dockerfile
# Secure Docker configuration
FROM node:18-alpine AS builder

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY --chown=nextjs:nodejs . .

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

# Install security updates
RUN apk update && apk upgrade

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app ./

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["npm", "start"]
```

```yaml
# Kubernetes security configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: paypass-api
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      containers:
      - name: paypass-api
        image: paypass/api:latest
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"
          requests:
            memory: "256Mi"
            cpu: "200m"
        env:
        - name: NODE_ENV
          value: "production"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: paypass-secrets
              key: jwt-secret
```

### Network Security
```yaml
# Network policies for Kubernetes
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: paypass-network-policy
spec:
  podSelector:
    matchLabels:
      app: paypass-api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: paypass-frontend
    - podSelector:
        matchLabels:
          app: paypass-gateway
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: paypass-database
    ports:
    - protocol: TCP
      port: 5432
  - to: []
    ports:
    - protocol: TCP
      port: 443 # HTTPS outbound
```

## Compliance Requirements

### GDPR Compliance
```typescript
interface GDPRCompliance {
  // Right to be informed
  getPrivacyNotice(): Promise<PrivacyNotice>;
  
  // Right of access
  exportUserData(userId: string): Promise<UserDataExport>;
  
  // Right to rectification
  updateUserData(userId: string, updates: UserDataUpdates): Promise<void>;
  
  // Right to erasure
  deleteUserData(userId: string, reason: DeletionReason): Promise<void>;
  
  // Right to restrict processing
  restrictProcessing(userId: string, restriction: ProcessingRestriction): Promise<void>;
  
  // Right to data portability
  exportDataPortable(userId: string, format: ExportFormat): Promise<PortableData>;
  
  // Right to object
  recordObjection(userId: string, objection: ProcessingObjection): Promise<void>;
}

class GDPRService implements GDPRCompliance {
  async exportUserData(userId: string): Promise<UserDataExport> {
    // Collect all user data from various services
    const [
      profile,
      transactions,
      preferences,
      auditLogs,
    ] = await Promise.all([
      this.userService.getProfile(userId),
      this.transactionService.getUserTransactions(userId),
      this.preferencesService.getUserPreferences(userId),
      this.auditService.getUserAuditLogs(userId),
    ]);

    // Anonymize sensitive data where required
    const anonymizedData = this.anonymizeSensitiveData({
      profile,
      transactions,
      preferences,
      auditLogs,
    });

    // Create comprehensive export
    return {
      userId,
      exportDate: new Date(),
      dataCategories: {
        personalData: anonymizedData.profile,
        transactionHistory: anonymizedData.transactions,
        preferences: anonymizedData.preferences,
        systemLogs: anonymizedData.auditLogs,
      },
      retentionPolicies: await this.getRetentionPolicies(),
      legalBasis: await this.getLegalBasisForProcessing(userId),
    };
  }

  async deleteUserData(userId: string, reason: DeletionReason): Promise<void> {
    // Verify deletion request is valid
    await this.validateDeletionRequest(userId, reason);

    // Check for legal obligations to retain data
    const retentionRequirements = await this.checkRetentionRequirements(userId);
    
    if (retentionRequirements.mustRetain) {
      // Anonymize instead of delete
      await this.anonymizeUserData(userId, retentionRequirements);
    } else {
      // Complete deletion
      await this.completeUserDeletion(userId);
    }

    // Record deletion for compliance
    await this.recordDeletion(userId, reason);
  }

  private async anonymizeUserData(
    userId: string,
    requirements: RetentionRequirements
  ): Promise<void> {
    // Replace personal identifiers with anonymous values
    const anonymousId = this.generateAnonymousId();
    
    // Update user profile
    await this.userService.anonymizeProfile(userId, {
      firstName: 'ANONYMIZED',
      lastName: 'USER',
      email: `${anonymousId}@anonymized.local`,
      phoneNumber: '+000000000000',
    });

    // Anonymize transaction data
    await this.transactionService.anonymizeTransactions(userId, anonymousId);

    // Keep minimal data for legal compliance
    await this.complianceService.recordAnonymization(userId, {
      anonymousId,
      retentionReason: requirements.reason,
      retentionPeriod: requirements.period,
    });
  }
}
```

### AML/KYC Compliance
```typescript
interface AMLKYCCompliance {
  performKYC(userId: string, documents: KYCDocuments): Promise<KYCResult>;
  screenAgainstSanctionsList(userInfo: UserInfo): Promise<SanctionsScreeningResult>;
  reportSuspiciousActivity(activity: SuspiciousActivity): Promise<void>;
  conductEnhancedDueDiligence(userId: string): Promise<EDDResult>;
  monitorTransactions(userId: string): Promise<void>;
}

interface KYCDocuments {
  identityDocument: Document;
  proofOfAddress: Document;
  additionalDocuments?: Document[];
}

interface Document {
  type: DocumentType;
  content: Buffer;
  metadata: DocumentMetadata;
}

enum DocumentType {
  PASSPORT = 'passport',
  NATIONAL_ID = 'national_id',
  DRIVERS_LICENSE = 'drivers_license',
  UTILITY_BILL = 'utility_bill',
  BANK_STATEMENT = 'bank_statement',
}

class AMLKYCService implements AMLKYCCompliance {
  constructor(
    private documentVerifier: DocumentVerificationService,
    private sanctionsScreener: SanctionsScreeningService,
    private riskAssessment: RiskAssessmentService
  ) {}

  async performKYC(userId: string, documents: KYCDocuments): Promise<KYCResult> {
    // Step 1: Verify identity document
    const identityVerification = await this.documentVerifier.verify(
      documents.identityDocument
    );

    if (!identityVerification.isValid) {
      return {
        status: 'failed',
        reason: 'Invalid identity document',
        details: identityVerification.errors,
      };
    }

    // Step 2: Verify proof of address
    const addressVerification = await this.documentVerifier.verify(
      documents.proofOfAddress
    );

    // Step 3: Extract and validate user information
    const extractedInfo = await this.extractUserInfo(documents);
    
    // Step 4: Screen against sanctions lists
    const sanctionsResult = await this.screenAgainstSanctionsList(extractedInfo);
    
    if (sanctionsResult.isMatch) {
      // Immediate escalation for sanctions match
      await this.escalateSanctionsMatch(userId, sanctionsResult);
      return {
        status: 'rejected',
        reason: 'Sanctions screening failed',
        requiresManualReview: true,
      };
    }

    // Step 5: Risk assessment
    const riskScore = await this.riskAssessment.calculateKYCRisk(extractedInfo);
    
    // Step 6: Determine KYC status
    const kycStatus = this.determineKYCStatus(
      identityVerification,
      addressVerification,
      riskScore
    );

    // Step 7: Store KYC results securely
    await this.storeKYCResults(userId, {
      status: kycStatus,
      verificationDate: new Date(),
      riskScore,
      documentsVerified: [
        documents.identityDocument.type,
        documents.proofOfAddress.type,
      ],
    });

    return {
      status: kycStatus,
      riskScore,
      verificationDate: new Date(),
      requiresEnhancedDueDiligence: riskScore > 70,
    };
  }

  async screenAgainstSanctionsList(userInfo: UserInfo): Promise<SanctionsScreeningResult> {
    // Screen against multiple sanctions lists
    const screeningResults = await Promise.all([
      this.sanctionsScreener.screenOFAC(userInfo), // US OFAC list
      this.sanctionsScreener.screenUN(userInfo),   // UN sanctions list
      this.sanctionsScreener.screenEU(userInfo),   // EU sanctions list
      this.sanctionsScreener.screenLocal(userInfo), // Local country sanctions
    ]);

    // Analyze results
    const matches = screeningResults.filter(result => result.isMatch);
    
    if (matches.length > 0) {
      // Log sanctions match immediately
      await this.auditLogger.log({
        action: 'sanctions_match_detected',
        userId: userInfo.userId,
        matchDetails: matches,
        timestamp: new Date(),
        severity: 'critical',
      });

      return {
        isMatch: true,
        matchingLists: matches.map(m => m.listName),
        confidence: Math.max(...matches.map(m => m.confidence)),
        details: matches,
      };
    }

    return {
      isMatch: false,
      matchingLists: [],
      confidence: 0,
      details: [],
    };
  }

  async reportSuspiciousActivity(activity: SuspiciousActivity): Promise<void> {
    // Create Suspicious Activity Report (SAR)
    const sar = {
      id: this.generateSARId(),
      reportDate: new Date(),
      activity,
      reporter: 'system',
      status: 'pending_review',
    };

    // Store SAR securely
    await this.sarRepository.create(sar);

    // Notify compliance team immediately
    await this.notificationService.sendComplianceAlert({
      type: 'suspicious_activity_detected',
      sarId: sar.id,
      priority: 'high',
      details: activity,
    });

    // Auto-escalate if high-risk indicators
    if (this.isHighRiskActivity(activity)) {
      await this.escalateToRegulators(sar);
    }
  }

  async conductEnhancedDueDiligence(userId: string): Promise<EDDResult> {
    // Enhanced due diligence for high-risk customers
    const user = await this.userService.getUser(userId);
    
    // Collect additional information
    const eddChecks = await Promise.all([
      this.verifySourceOfFunds(userId),
      this.checkPoliticalExposure(user),
      this.analyzeTransactionPatterns(userId),
      this.verifyBusinessPurpose(userId),
      this.checkAdverseMedia(user),
    ]);

    const eddScore = this.calculateEDDScore(eddChecks);
    
    return {
      userId,
      eddScore,
      checks: eddChecks,
      recommendation: this.getEDDRecommendation(eddScore),
      reviewDate: new Date(),
      nextReviewDate: this.calculateNextReviewDate(eddScore),
    };
  }

  private async verifySourceOfFunds(userId: string): Promise<SourceOfFundsCheck> {
    // Verify where the customer's funds come from
    const transactions = await this.transactionService.getRecentTransactions(userId, 90);
    const patterns = this.analyzeTransactionPatterns(transactions);
    
    return {
      type: 'source_of_funds',
      status: patterns.isConsistent ? 'verified' : 'requires_documentation',
      details: patterns,
    };
  }

  private async checkPoliticalExposure(user: User): Promise<PEPCheck> {
    // Check if user is a Politically Exposed Person (PEP)
    const pepResult = await this.pepScreener.screen(user);
    
    return {
      type: 'pep_screening',
      isPEP: pepResult.isMatch,
      details: pepResult.matches,
      riskLevel: pepResult.riskLevel,
    };
  }
}
```

---

This comprehensive security guide provides the foundation for building a secure, compliant PayPass platform. Each security measure should be implemented progressively, with regular security audits and updates to maintain the highest security standards.