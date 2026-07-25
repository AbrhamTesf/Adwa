import React, { forwardRef, useEffect, useRef, useState, useImperativeHandle } from 'react';

/**
 * InteractiveModelViewer
 * Premium 3D viewer component with interactive 2D poster fallback overlay,
 * real-time download progress bar, and historical exhibit trivia.
 */
const InteractiveModelViewer = forwardRef(function InteractiveModelViewer(
  {
    modelPath,
    posterPath,
    altText = 'Adwa Historical Artifact 3D Model',
    exhibitTrivia,
    children,
    className = 'w-full h-full object-contain relative z-10',
    containerClassName = 'relative w-full max-w-lg aspect-square mx-auto flex items-center justify-center',
    onProgress,
    onLoad,
    autoRotate = true,
    cameraControls = true,
    shadowIntensity = '1.5',
    exposure = '1.15',
    ...props
  },
  ref
) {
  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const internalRef = useRef(null);

  // Expose internal ref to parent component
  useImperativeHandle(ref, () => internalRef.current);

  useEffect(() => {
    const el = internalRef.current;
    if (!el) return;

    // Reset loading state when modelPath changes
    setIsLoaded(false);
    setLoadProgress(0);

    const handleModelLoad = (e) => {
      console.log('[InteractiveModelViewer] 3D Model loaded successfully:', modelPath);
      setIsLoaded(true);
      if (onLoad) onLoad(e);
    };

    const handleModelProgress = (e) => {
      const progress = Math.round((e.detail?.totalProgress || 0) * 100);
      setLoadProgress(progress);
      if (onProgress) onProgress(e);
    };

    const handleModelError = (e) => {
      console.error('[InteractiveModelViewer] Error loading 3D model:', modelPath, e);
    };

    // Attach native DOM event listeners for Web Component events
    el.addEventListener('load', handleModelLoad);
    el.addEventListener('progress', handleModelProgress);
    el.addEventListener('error', handleModelError);

    // If model-viewer already finished loading before listeners attached
    if (el.loaded) {
      handleModelLoad({ target: el });
    }

    return () => {
      el.removeEventListener('load', handleModelLoad);
      el.removeEventListener('progress', handleModelProgress);
      el.removeEventListener('error', handleModelError);
    };
  }, [modelPath, onLoad, onProgress]);

  return (
    <div className={containerClassName}>
      {/* Background Ambient Radial Glow */}
      <div className="absolute inset-0 bg-radial from-amber-500/20 via-yellow-600/10 to-transparent blur-3xl rounded-full pointer-events-none" />

      <model-viewer
        ref={internalRef}
        src={modelPath}
        poster={posterPath}
        alt={altText}
        loading="eager"
        reveal="auto"
        auto-rotate={autoRotate ? "" : undefined}
        camera-controls={cameraControls ? "" : undefined}
        touch-action="pan-y"
        shadow-intensity={shadowIntensity}
        exposure={exposure}
        class={className}
        style={{
          width: '100%',
          height: '100%',
          '--poster-color': 'transparent'
        }}
        {...props}
      >
        {/* Slot: Custom Interactive Poster & Loading Skeleton Overlay */}
        {!isLoaded && (
          <div
            slot="poster"
            className="absolute inset-0 flex flex-col items-center justify-between p-6 bg-stone-950/80 backdrop-blur-md rounded-2xl border border-amber-500/20 z-20 transition-opacity duration-500"
          >
            {/* Instant 2D High-Res Image Preview */}
            <div className="relative w-full h-48 flex items-center justify-center">
              {posterPath && (
                <img
                  src={posterPath}
                  alt={altText}
                  className="w-full h-full object-contain animate-pulse"
                />
              )}
            </div>

            {/* Interactive Loading Progress Bar */}
            <div className="w-full space-y-2 text-center">
              <div className="flex justify-between text-xs text-amber-300 font-mono">
                <span>Summoning Artifact 3D Mesh...</span>
                <span>{loadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden border border-amber-500/30">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-500 transition-all duration-300 ease-out"
                  style={{ width: `${Math.max(loadProgress, 5)}%` }}
                />
              </div>
            </div>

            {/* Interactive Historical Trivia Snippet */}
            {exhibitTrivia && (
              <div className="w-full bg-amber-950/40 p-3 rounded-xl border border-amber-500/20 text-xs text-amber-200/90 text-center italic">
                💡 <span className="font-semibold text-amber-400">Did you know?</span> {exhibitTrivia}
              </div>
            )}
          </div>
        )}

        {children}
      </model-viewer>
    </div>
  );
});

export default InteractiveModelViewer;
