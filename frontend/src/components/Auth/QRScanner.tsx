import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore - html5-qrcode doesn't have TypeScript definitions
import { Html5Qrcode } from 'html5-qrcode';
import './QRScanner.css';

interface QRScannerProps {
  onScan: (s0Key: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  // @ts-ignore - Html5Qrcode type not available
  const scannerRef = useRef<any>(null);
  const isRunningRef = useRef<boolean>(false);
  // Removed unused isScanning state
  const [error, setError] = useState<string>('');
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const lastScanTimeRef = useRef<number>(0);

  useEffect(() => {
    const startScanning = async () => {
      try {
        // @ts-ignore - Html5Qrcode constructor
        const html5QrCode = new Html5Qrcode('qr-reader');
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' }, // Use back camera
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          (decodedText: string) => {
            // Prevent processing the same code multiple times (within 2 seconds)
            const now = Date.now();
            if (decodedText === lastScannedCode && (now - (lastScanTimeRef.current || 0)) < 2000) {
              return;
            }
            setLastScannedCode(decodedText);
            lastScanTimeRef.current = now;

            console.log('📷 Scanned QR Code:', decodedText);
            setValidationStatus('validating');
            setError('');

            // Step 1: Try to extract S0 Key from various formats
            // Pattern: S followed by O or 0, then exactly 7 digits (e.g., SO1234567)
            const s0KeyPattern = /S[O0]\d{7}/i;
            let match = decodedText.match(s0KeyPattern);
            
            // If not found directly, try to find it in structured formats (JSON, URL params, etc.)
            if (!match) {
              const patterns = [
                /S[O0]\d{7}/i,                                    // Direct: SO1234567 or S01234567
                /"studentId":\s*"([^"]+)"/i,                     // JSON: "studentId": "SO1234567"
                /"s0Key":\s*"([^"]+)"/i,                          // JSON: "s0Key": "SO1234567"
                /student[_-]?id[=:]?\s*([SO0]\d{7})/i,           // student-id=SO1234567
                /s0[_-]?key[=:]?\s*([SO0]\d{7})/i,               // s0-key=SO1234567
                /id[=:]?\s*([SO0]\d{7})/i,                        // id=SO1234567
                /([SO0]\d{7})/i                                   // Anywhere: SO1234567 or S01234567
              ];

              for (const pattern of patterns) {
                match = decodedText.match(pattern);
                if (match) {
                  // Extract the S0 Key from the match
                  const extracted = (match[1] || match[0]).trim();
                  // Validate the extracted value matches S0 key format
                  if (/^S[O0]\d{7}$/i.test(extracted)) {
                    match = [extracted];
                    break;
                  }
                }
              }
            }

            // Step 2: Check if S0 Key was found
            if (!match) {
              setValidationStatus('invalid');
              setError('❌ No valid SEMO S0 Key found. Please scan your SEMO student ID card QR code.\n\nExpected format: SO followed by 7 digits (e.g., SO1234567)');
              setTimeout(() => {
                setError('');
                setValidationStatus('idle');
              }, 5000);
              return;
            }

            // Step 3: Extract and normalize the S0 Key
            let s0Key = (match[1] || match[0]).toUpperCase().trim();
            
            // Remove any non-alphanumeric characters except S, O, 0, and digits
            s0Key = s0Key.replace(/[^SO0-9]/g, '');
            
            // Step 4: Validate format BEFORE normalization
            // Must start with S, followed by O or 0, then exactly 7 digits
            if (!/^S[O0]\d{7}$/.test(s0Key)) {
              setValidationStatus('invalid');
              setError(`❌ Invalid S0 Key format detected: "${s0Key}"\n\nExpected format: SO followed by 7 digits (e.g., SO1234567)\n\nPlease ensure you are scanning a valid SEMO student ID card.`);
              setTimeout(() => {
                setError('');
                setValidationStatus('idle');
              }, 5000);
              return;
            }
            
            // Step 5: Normalize: convert S0 (zero) to SO (letter O) for consistency
            s0Key = s0Key.replace(/^S0(\d+)/, 'SO$1');
            
            // Step 6: Final validation: ensure it matches the exact normalized format
            if (!/^SO\d{7}$/.test(s0Key)) {
              setValidationStatus('invalid');
              setError(`❌ S0 Key format validation failed: "${s0Key}"\n\nExpected format: SO followed by 7 digits (e.g., SO1234567)`);
              setTimeout(() => {
                setError('');
                setValidationStatus('idle');
              }, 5000);
              return;
            }

            // Step 7: Additional validation - ensure the 7 digits are actually numbers
            const digits = s0Key.substring(2);
            if (!/^\d{7}$/.test(digits)) {
              setValidationStatus('invalid');
              setError(`❌ Invalid S0 Key: The 7-digit portion must be numeric.\n\nDetected: ${s0Key}`);
              setTimeout(() => {
                setError('');
                setValidationStatus('idle');
              }, 5000);
              return;
            }

            // Step 8: All validations passed!
            setValidationStatus('valid');
            console.log('✅ Valid SEMO S0 Key extracted and validated:', s0Key);

            // Step 9: Stop scanner and proceed with login
            // Show success message briefly before proceeding
            setError('');
            
            if (isRunningRef.current) {
              html5QrCode.stop().then(() => {
                isRunningRef.current = false;
                setIsScanning(false);
                // Reset lastScannedCode after a delay to allow new scans
                setTimeout(() => {
                  setLastScannedCode('');
                  lastScanTimeRef.current = 0;
                  setValidationStatus('idle');
                }, 2000);
                onScan(s0Key);
              }).catch((err: any) => {
                console.log('Stop error (ignored):', err);
                isRunningRef.current = false;
                setIsScanning(false);
                setTimeout(() => {
                  setLastScannedCode('');
                  lastScanTimeRef.current = 0;
                  setValidationStatus('idle');
                }, 2000);
                onScan(s0Key);
              });
            } else {
              setIsScanning(false);
              setTimeout(() => {
                setLastScannedCode('');
                lastScanTimeRef.current = 0;
                setValidationStatus('idle');
              }, 2000);
              onScan(s0Key);
            }
          },
          (errorMessage: string) => {
            // Ignore scanning errors (they're frequent during scanning)
            // Only log if it's not a "NotFoundException" (normal during scanning)
            if (!errorMessage.includes('NotFoundException')) {
              console.log('QR scan error:', errorMessage);
            }
          }
        );

        isRunningRef.current = true;
        setIsScanning(true);
        setError('');
        setValidationStatus('idle');
      } catch (err: any) {
        console.error('❌ Scanner error:', err);
        setError(err.message || 'Failed to start camera. Please check permissions and try again.');
        setIsScanning(false);
        setValidationStatus('idle');
      }
    };

    startScanning();

    return () => {
      if (scannerRef.current && isRunningRef.current) {
        scannerRef.current.stop().catch(() => {
          // Ignore errors when stopping
        });
        isRunningRef.current = false;
      }
    };
  }, [onScan]);

  const handleClose = async () => {
    if (scannerRef.current && isRunningRef.current) {
      try {
        await scannerRef.current.stop();
        isRunningRef.current = false;
      } catch (err) {
        console.log('Scanner stop error (ignored):', err);
        isRunningRef.current = false;
      }
    }
    setIsScanning(false);
    setError('');
    onClose();
  };

  return (
    <div className="qr-scanner-overlay">
      <div className="qr-scanner-modal">
        <div className="qr-scanner-header">
          <h3>📷 Scan SEMO Student ID</h3>
          <button className="qr-scanner-close" onClick={handleClose}>✕</button>
        </div>
        
        <div className="qr-scanner-content">
          {validationStatus === 'validating' && (
            <div className="qr-scanner-validating">
              🔍 Validating S0 Key format...
            </div>
          )}
          
          {validationStatus === 'valid' && (
            <div className="qr-scanner-success">
              ✅ Valid SEMO S0 Key detected! Logging you in...
            </div>
          )}
          
          {error && (
            <div className="qr-scanner-error">
              {error}
            </div>
          )}
          
          <div id="qr-reader" className="qr-reader-container"></div>
          
          <div className="qr-scanner-instructions">
            <p><strong>📱 Point your camera at your SEMO student ID QR code</strong></p>
            <p className="qr-hint">Make sure the QR code is clearly visible, well-lit, and centered in the frame</p>
            <p className="qr-hint" style={{ fontSize: '0.8rem', color: '#C8102E', marginTop: '0.5rem' }}>
              Only SEMO student ID cards will be accepted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;

