import { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Camera,
  Upload,
  Loader2,
  Star,
  CheckCircle2,
  XCircle,
  ImageIcon,
} from 'lucide-react';
import { useTaskVerification, type VerificationResult } from '@/hooks/useTaskVerification';

interface ProofUploadDialogProps {
  open: boolean;
  onClose: () => void;
  task: {
    id: string;
    title: string;
    description?: string | null;
    category?: string;
  };
  onVerified?: (result: VerificationResult) => void;
}

export default function ProofUploadDialog({
  open,
  onClose,
  task,
  onVerified,
}: ProofUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const { verifyTaskProof, isVerifying, progress } = useTaskVerification();

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    setSelectedFile(file);
    setResult(null);

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleVerify = async () => {
    if (!selectedFile) return;

    const verification = await verifyTaskProof(selectedFile, {
      id: task.id,
      title: task.title,
      description: task.description || undefined,
    });

    if (verification) {
      setResult(verification);
      onVerified?.(verification);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    onClose();
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (rating >= 5) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 9) return 'Excellent';
    if (rating >= 7) return 'Good';
    if (rating >= 5) return 'Acceptable';
    if (rating >= 3) return 'Needs Improvement';
    return 'Insufficient';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-purple-400" />
            Verify Completion
          </DialogTitle>
          <DialogDescription>
            Upload a photo as proof for: <strong>{task.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Upload Area */}
          {!preview ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border/50 rounded-xl p-8 flex flex-col items-center gap-3 hover:border-purple-500/50 hover:bg-purple-500/5 transition-colors cursor-pointer"
            >
              <div className="p-3 rounded-full bg-purple-500/10">
                <ImageIcon className="w-8 h-8 text-purple-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Upload proof image</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Take a photo or select from gallery (max 5MB)
                </p>
              </div>
            </button>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-border/50">
              <img
                src={preview}
                alt="Proof preview"
                className="w-full h-48 object-cover"
              />
              {!isVerifying && !result && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
                >
                  <Upload className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          )}

          {/* Progress */}
          {isVerifying && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span className="text-sm">AI is analyzing your proof...</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3 p-4 rounded-xl bg-card border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {result.rating >= 5 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span className="font-medium">{getRatingLabel(result.rating)}</span>
                </div>
                <Badge
                  variant="outline"
                  className={getRatingColor(result.rating)}
                >
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  {result.rating}/10
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{result.feedback}</p>
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">
                  Relevance: {result.relevance}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {result.completeness}
                </Badge>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {result ? (
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleVerify}
                disabled={!selectedFile || isVerifying}
                className="gap-2"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Verify with AI
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
