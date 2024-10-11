'use client';

import React, {Dispatch, MouseEventHandler, SetStateAction, useEffect, useRef} from 'react';
import ImageEditor from "@/components/ImageEditor";
import LoadingCircle from "@/components/LoadingCircle";
import { useState } from 'react';


const AnnotationsPage = () => {

      const [images, setImages] = useState<Record<string, { annotations: string[], id:string }> | null>(null);
      const [expandedImages, setExpandedImages] = useState<string[]>([]);

      const [currentAnnotations, setCurrentAnnotations] = useState<Record<string,number[][]>|null>(null);
      const [currentAnnotationsId, setCurrentAnnotationsId] = useState<string|null>(null);

      const [imageData, setImageData] = useState<string | null>(null);
      const [currentImageId, setCurrentImageId] = useState<string>();

      const workspaceRef = useRef<HTMLDivElement | null>(null);
      const rightPanelRef = useRef<HTMLDivElement | null>(null);
      const topPanelRef = useRef<HTMLDivElement | null>(null);
      const bottomPanelRef = useRef<HTMLDivElement | null>(null);
      const resizerVerticalRef = useRef<HTMLDivElement | null>(null);
      const resizerHorizontalRef = useRef<HTMLDivElement | null>(null);


      useEffect(() => {
          workspaceRef.current = document.getElementById('workspace') as HTMLDivElement;
          rightPanelRef.current = document.getElementById('right-panel') as HTMLDivElement;
          topPanelRef.current = document.getElementById('top-panel') as HTMLDivElement;
          bottomPanelRef.current = document.getElementById('bottom-panel') as HTMLDivElement;
          resizerVerticalRef.current = document.getElementById('vertical-resizer') as HTMLDivElement;
          resizerHorizontalRef.current = document.getElementById('horizontal-resizer') as HTMLDivElement;


          workspaceRef.current.style.width = `${(window.innerWidth-90)*7/9}px`;
          rightPanelRef.current.style.width = `${(window.innerWidth-90)*2/9}px`;

          topPanelRef.current.style.height = `${(window.innerHeight-60)/2}px`;
          bottomPanelRef.current.style.height = `${(window.innerHeight-60)/2}px`;


          const fetchData = async () => {
              try {
                  const response = await fetch(`/api/schema`);
                  const result = await response.json();
                  setImages(result);
              } catch (error) {
                  console.error('Error fetching images data:', error);
              }
            };
            fetchData().then();

          }, []);

      useEffect(() => {
          if (currentAnnotations){
           annotationsUpdate(currentAnnotations).then();
          }
    }, [annotationsUpdate, currentAnnotations]);


    let isResizingVertical = false;
    let isResizingHorizontal = false;

    resizerVerticalRef.current?.addEventListener('mousedown', () => {
      isResizingVertical = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    resizerHorizontalRef.current?.addEventListener('mousedown', () => {
      isResizingHorizontal = true;
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    });

    if (typeof document !== "undefined") {
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('mousemove', onMouseMove);
    }

    function onMouseMove(e: MouseEvent): void {
        if (resizerVerticalRef.current?.offsetWidth &&
            resizerHorizontalRef.current?.offsetHeight &&
            workspaceRef.current &&
            rightPanelRef.current &&
            topPanelRef.current &&
            bottomPanelRef.current){
      if (isResizingVertical){
          const newWidth = e.clientX-70-resizerVerticalRef.current.offsetWidth/2;
          const rightWidth = window.innerWidth-90-resizerVerticalRef.current.offsetWidth-newWidth;

          if (newWidth > (window.innerWidth-90)/3 && rightWidth > (window.innerWidth-90)/5) {
            workspaceRef.current.style.width = `${newWidth}px`;
            rightPanelRef.current.style.width = `${rightWidth}px`;
        }
      }
      if (isResizingHorizontal) {
          const weirdOffSet = 15;
          const topHeight = e.clientY - 20 - resizerHorizontalRef.current.offsetHeight / 2 - weirdOffSet;
          const bottomHeight = window.innerHeight - 40 - resizerHorizontalRef.current.offsetHeight - topHeight + weirdOffSet;
          if (topHeight > (window.innerHeight - 200) / 5 && bottomHeight > (window.innerHeight) / 5) {
              topPanelRef.current.style.height = `${topHeight}px`;
              bottomPanelRef.current.style.height = `${bottomHeight}px`;
          }
      }
      }
    }

    function onMouseUp():void {
              isResizingVertical = false;
              isResizingHorizontal = false;
              document.body.style.cursor = '';
              document.body.style.userSelect = '';
            }


    interface Row{
        key: string;
        imageName: string;
        flag: boolean;
        value: string|null;
        fun: MouseEventHandler;
        format: string;
    }

    function toggle(imageName:string): void {
        if (expandedImages.includes(imageName)){
            setExpandedImages(expandedImages.filter((row) => row !== imageName));
        } else {
            setExpandedImages([...expandedImages, imageName]);
        }
    }

    function getRows(): Row[]{
        const entries: Row[]=[];
        for (const imageName in images){
            const annotations = images[imageName].annotations;
            const annotationsCount=annotations.length;
            entries.push({
                    key:imageName,
                    imageName: imageName,
                    flag: true,
                    value: annotationsCount.toString(),
                    fun:annotationsCount>0 ? ()=>{toggle(imageName)}:()=>{getImageWithoutAnnotations(images[imageName].id)},
                    format: " text-center"
                })
            if (annotationsCount>0 && expandedImages.includes(imageName)){
                for (const annotation in annotations){
                    const annotationsId=annotations[annotation];
                    entries.push({
                        key:imageName+annotationsId,
                        imageName: imageName,
                        flag: false,
                        value: annotationsId,
                        fun: ()=>{getImageWithAnnotations(images[imageName].id,annotationsId)},
                        format: " text-left",
                    })
                }
            }
        }
        return entries;
    }

    async function getAnnotations(annotationsId: string){
        try{
            if (currentAnnotationsId==annotationsId){
                return;
            }
            const response = await fetch(`/api/annotations/?annotation_id=${annotationsId}`);
            const result = await response.json();
            setCurrentAnnotationsId(annotationsId);
            setCurrentAnnotations(result);

        } catch (error){
            console.error('Error fetching annotations data:', error);
        }
    }

    async function getImage(imageId: string){
        try{
            if (currentImageId==imageId){
                return;
            }
            const formData = new FormData();
            formData.append('file_id',imageId)
            const response = await fetch(`/api/images/?file_id=${imageId}`, {
                    method: "GET",
                    headers: {
                      "Content-Type": "application/octet-stream", // Binary data format
                    }
                  });
            if (!response.ok) {
                throw new Error("Failed to fetch image");
              }
            const imageBlob = await response.blob();
            const reader = new FileReader();

            reader.onloadend = () => {
            setImageData(reader.result as string);
           };
           reader.readAsDataURL(imageBlob);
           setCurrentImageId(imageId);

        } catch (error){
            console.error('Error fetching annotations data:', error);
        }
    }

    function getImageWithoutAnnotations(imageId:string){
        getImage(imageId).then();
        newAnnotation(imageId).then();
    }

    function getImageWithAnnotations(imageId:string, annotationsId:string){
        getImage(imageId).then();
        getAnnotations(annotationsId).then();
    }


    async function changeAnnotationKey(newKey:string, oldKey:string){
        if (currentAnnotations && currentAnnotations[oldKey]){
            if (currentAnnotations[newKey]==null){

                setCurrentAnnotations((prevAnnotations)=>{
                  const updatedAnnotations = { ...prevAnnotations };
                  updatedAnnotations[newKey] = updatedAnnotations[oldKey];
                  delete updatedAnnotations[oldKey];
                  annotationsUpdate(updatedAnnotations).then();
                  return updatedAnnotations;});
            }
        }
    }

    function deleteAnnotation(key:string){
        if (currentAnnotations && currentAnnotations[key]){
            setCurrentAnnotations((prevAnnotations)=>{
                const updatedAnnotations = { ...prevAnnotations };
                delete updatedAnnotations[key];
                annotationsUpdate(updatedAnnotations).then();
                return updatedAnnotations;
            });
        }
    }

    function handleEnterKey(e:React.KeyboardEvent<HTMLInputElement>, oldKey:string){
        if (e.key =='Enter' && e.currentTarget.value){
            changeAnnotationKey(e.currentTarget.value, oldKey).then();
            e.currentTarget.value='';
        }
    }

    function handleUnFocus(e:React.FocusEvent<HTMLInputElement>){
        e.currentTarget.value='';
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    async function annotationsUpdate(newAnnotations:Record<string,number[][]>){
        if (currentAnnotationsId && newAnnotations){
            try {
                const annotationData = {
                    annotation_id: currentAnnotationsId,
                    data: newAnnotations,
              };
                const response = await fetch(`/api/annotations/`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(annotationData),
                });
                if (!response.ok) {
                    throw new Error("failed to update annotation");
                }
            } catch (error) {
            console.error(`Error updating annotations ${currentAnnotationsId}: ${(error as Error).message}`);
          }
        }
    }



    async function newAnnotation(imageId:string){
        try {
            const annotationData = {
                  file_id: imageId, // Use the file_id for the corresponding file
              };
            const response = await fetch(`/api/annotations/`, {
                method: 'POST',
                headers: {
                      'Content-Type': 'application/json',
                  },
                body: JSON.stringify(annotationData),});
            if (!response.ok) {
                    throw new Error("failed to add annotations");
                }
            const  result = await response.json();

            setImages(prevImages => {
                if (!prevImages) return prevImages; // Early return if state is null
            
                const updatedImages = { ...prevImages }; // Shallow copy of the previous state
            
                // Use a for...in loop to iterate over the object keys
                for (const key in updatedImages) {
                  if (updatedImages[key].id === imageId) {
                      toggle(key);
                    // Append the result ID to the annotations array
                    updatedImages[key] = {
                      ...updatedImages[key],
                      annotations: [...updatedImages[key].annotations, result.id],
                    };
                    break; // Exit the loop once we find the match
                  }
                }
            
                // Return the updated images object
                return updatedImages;
              });


            await getAnnotations(result['id']);

        } catch (error) {
            console.error(`Error posting annotations : ${(error as Error).message}`);
        }
    }

    return (
        <div className="flex h-full">
            <div id="workspace" className={`bg-zinc-700 p-4 `}>
                {imageData && currentAnnotations ? (
                    <ImageEditor imageData={imageData} annotations={currentAnnotations}
                                 setAnnotations={setCurrentAnnotations as Dispatch<SetStateAction<Record<string, number[][]>>>}/>
                ) : (
                    <LoadingCircle></LoadingCircle>
                  )}
            </div>

            <div id="vertical-resizer" className="w-2 bg-zinc-800 cursor-col-resize"></div>

            <div id="right-panel" className=" bg-zinc-800 flex-grow p-4 text-zinc-300">
                <div id="top-panel" className="flex-grow">
                    <div className={"relative flex flex-col h-full w-full"}>
                        <div className={"h-7 w-full"}>
                            <table className={"table-auto w-full border-b-zinc-900 border-b-2"}>
                                <thead>
                                    <tr>
                                        <th className={"w-[60%] text-left font-extrabold"}>
                                            File
                                        </th>
                                        <th className={"w-[40%] text-center font-extrabold"}>
                                            Annotations
                                        </th>
                                    </tr>
                                </thead>
                            </table>
                        </div>
                        <div className={"relative flex grow w-full min-h-0"}>
                            <div className={"relative h-full w-full overflow-y-auto scrollbar-hidden"}>
                                <table className={"table-fixed relative w-full"}>
                                    <tbody>
                                    {getRows().map((row) => (
                                        <tr key={row.key} onClick={row.fun}>
                                            <td className={'relative w-[60%]'}>
                                                <p className={"truncate hover:overflow-visible max-w-full "}> {row.flag && row.imageName}</p>
                                            </td>
                                            <td className={"relative w-[40%] "}>
                                                <p className={"truncate min-w-full "+row.format}>{row.value}</p>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="horizontal-resizer"
                     className="h-3 cursor-row-resize"></div>

                <div id="bottom-panel" className="flex-grow overflow-auto text-zinc-300">
                    <div className={"relative flex flex-col h-full w-full"}>
                        <div className={"h-7 w-full"}>
                            <table className={"table-auto w-full border-b-zinc-900 border-b-2"}>
                                <thead>
                                <tr>
                                    <th className={"w-[40%] text-left font-extrabold"}>
                                        Annotation
                                    </th>
                                    <th className={"w-[60%] text-center font-extrabold"}>
                                        Data
                                    </th>
                                </tr>
                                </thead>
                            </table>
                        </div>
                        <div className={"relative flex grow w-full min-h-0"}>
                            <div className={"relative h-full w-full overflow-y-auto scrollbar-hidden"}>
                                <table className={"table-fixed relative w-full"}>
                                    <tbody>
                                    {
                                        currentAnnotations && Object.entries(currentAnnotations).map(([key, row]) => {
                                            return (
                                                <tr key={key}>
                                                    <td className={"relative w-[35%]"}>
                                                        <input id={(currentImageId && currentAnnotationsId && currentImageId+currentAnnotationsId)+key}
                                                                className={"bg-zinc-800 truncate w-full text-zinc-300 placeholder:text-zinc-300"}
                                                               type="text"
                                                               placeholder={key}
                                                               onKeyDown={(e)=>{handleEnterKey(e,key)}}
                                                               onBlur={(e)=>{handleUnFocus(e)}}>
                                                        </input>
                                                    </td>
                                                    <td className={"relative w-[55%]"}>
                                                        <p className={"truncate"}>
                                                            {row.toString()}
                                                        </p>
                                                    </td>
                                                    <td className="relative w-[10%]">
                                                        <i
                                                            className="fas fa-trash cursor-pointer"
                                                            onClick={()=>{deleteAnnotation(key)}}
                                                            aria-hidden="true"
                                                        ></i>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>


    );
};

export default AnnotationsPage;