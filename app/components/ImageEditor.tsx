import React, { useRef, useEffect, useState } from 'react';

interface ImageEditorProps {
  imageData: string;
  annotations: Record<string, number[][]>;
  setAnnotations: React.Dispatch<React.SetStateAction<Record<string, number[][]>>>;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ imageData, annotations, setAnnotations }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const parentRef = useRef<HTMLDivElement | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  const [currentObject, setCurrentObject] = useState<number[][]>([]); // This stores the current drawing object
  const [scaleX, setScaleX] = useState<number>(1);
  const [scaleY, setScaleY] = useState<number>(1);

  // Load the image when imageData changes
  useEffect(() => {
    const img = new Image();
    img.src = imageData;
    img.onload = () => {
        setImage(img); // Save the loaded image to the state
        updateCanvasSize(img);
      };
    }, [imageData]);

    // Draw the image and annotations on the canvas
  useEffect(() => {

      // Draw annotations
    const drawAnnotations = (
      context: CanvasRenderingContext2D,
      annotations: Record<string, number[][]>
      ) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        Object.entries(annotations).forEach(([_, points]) => {
          drawShape(context, points);
        });
      };

    const drawShape = (context: CanvasRenderingContext2D, points: number[][]) => {
      context.beginPath();
      if (points.length === 1) {
        const [x, y] = points[0];
        context.arc(x * scaleX, y * scaleY, 5, 0, 2 * Math.PI);
        context.fillStyle = 'red';
        context.fill();
      } else if (points.length === 2) {
        const [[x1, y1], [x2, y2]] = points;
        context.moveTo(x1 * scaleX, y1 * scaleY);
        context.lineTo(x2 * scaleX, y2 * scaleY);
        context.strokeStyle = 'blue';
        context.lineWidth = 2;
        context.stroke();
      } else if (points.length > 2) {
        const [firstPoint, ...otherPoints] = points;
        context.moveTo(firstPoint[0] * scaleX, firstPoint[1] * scaleY);
        otherPoints.forEach(([x, y]) => {
          context.lineTo(x * scaleX, y * scaleY);
        });
        context.closePath();
        context.strokeStyle = 'green';
        context.lineWidth = 2;
        context.stroke();
        }
      };

    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (canvas && image && context) {
      context.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
      context.drawImage(image, 0, 0, canvas.width, canvas.height); // Draw image

      // Draw all stored annotations
      drawAnnotations(context, annotations);

      if (currentObject.length > 0) {
        drawShape(context, currentObject); // Draw the currently drawing object
      }
    }
  }, [image, annotations, currentObject, scaleX, scaleY]);

  // Update the canvas size when the parent container resizes
  useEffect(() => {
    const parent = parentRef.current;

    if (!parent || !image) return;

    let clicked = false;
    let resizingNeeded = false;


    const resizeObserver = new ResizeObserver(() => {
      resizingNeeded=true;
    });

    const handleMouseUpReSize=()=>{
      if (clicked && resizingNeeded){
        updateCanvasSize(image);
        resizingNeeded=false;
      }
      clicked = false;
    }

    const handleMouseDownReSize=()=>{
      clicked=true;
      resizingNeeded=false;
    }

    window.addEventListener('mouseup',handleMouseUpReSize);
    window.addEventListener('mousedown',handleMouseDownReSize);



    resizeObserver.observe(parent);

    // Clean up observer on unmount
    return () => {
      if (parent) resizeObserver.unobserve(parent);
      window.removeEventListener('mouseup',handleMouseUpReSize);
      window.removeEventListener('mousedown',handleMouseDownReSize);
    };
  }, [image]);


  // Handle mouse down to start drawing (adjust the click coordinates for scaling)
  const handleMouseDown = (event: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / scaleX;
      const y = (event.clientY - rect.top) / scaleY;
      setCurrentObject((pastObj) => [...pastObj, [x, y]]);
    }
  };

  // Handle key down (Enter key to save the object to annotations)
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && currentObject.length > 0) {
      const newAnnotationKey = `annotation_${Object.keys(annotations).length + 1}`;
      setAnnotations((prev) => ({
        ...prev,
        [newAnnotationKey]: currentObject,
      }));
      setCurrentObject([]);
    }

    if (event.ctrlKey && event.key === 'z' && currentObject.length > 0) {
      setCurrentObject((pastObj) => pastObj.slice(0, -1));
    }
  };



  // Update canvas size and scale factors when image or parent changes
  const updateCanvasSize = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    const parent = parentRef.current;

    if (canvas && parent) {
      const parentWidth = parent.clientWidth;
      const parentHeight = parent.clientHeight;

      const imageAspectRatio = img.width / img.height;
      let canvasWidth = parentWidth;
      let canvasHeight = parentHeight;

      // Adjust canvas size based on image aspect ratio
      if (canvasWidth / canvasHeight > imageAspectRatio) {
        canvasWidth = canvasHeight * imageAspectRatio;
      } else {
        canvasHeight = canvasWidth / imageAspectRatio;
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Update scale factors based on new canvas dimensions
      setScaleX(canvas.width / img.width);
      setScaleY(canvas.height / img.height);
    }
  };

  return (
    <div
      ref={parentRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden' }}
      tabIndex={0} // To allow keyboard input
      onKeyDown={handleKeyDown}
      className="grid w-full justify-center content-evenly align-center"
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};

export default ImageEditor;
