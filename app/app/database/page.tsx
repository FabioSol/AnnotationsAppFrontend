'use client';
import React, {MouseEventHandler, useEffect, useState} from 'react';
import LoadingCircle from "@/components/LoadingCircle";
import ExportButton from "@/components/ExportButton";

const DatabasePage = () => {
  const [images, setImages] = useState<Record<string, { annotations: string[], id:string }> | null>(null);
  const [expandedImages, setExpandedImages] = useState<string[]>([]); // a list of strings for each fileName
  const [expandedAnnotations, setExpandedAnnotations] = useState<string[]>([]); // a list of strings for each annotation id
  const [annotations, setAnnotations] = useState<{ [key: string]: {[key: string]:[]} }>({});

  useEffect(() => {
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

  const fetchAnnotations = async (annotationId: string) => {
    try {
      const response = await fetch(`api/annotations/?annotation_id=${annotationId}`);
      const result = await response.json();
      setAnnotations((prevAnnotations) => ({
        ...prevAnnotations,
        [annotationId]: result,
      }));
    } catch (error) {
      console.error('Error fetching annotations data:', error);
    }
  };

  const invalidateAnnotations = (annotationId: string) => {
    setAnnotations((prevAnnotations) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [annotationId]: _, ...restAnnotations } = prevAnnotations;
      return restAnnotations;
    });
  };

  const toggleRow = (fileName: string) => {
    if (images && images[fileName].annotations && images[fileName].annotations.length>0){
      if (expandedImages.includes(fileName)) {
        setExpandedImages(expandedImages.filter((row) => row !== fileName));
        if (images[fileName].annotations) {
          images[fileName].annotations.forEach((annotationId: string) => {
            invalidateAnnotations(annotationId);
            if (expandedAnnotations.includes(annotationId)){
              toggleSubRow(annotationId);
            }
          });
        }
      } else {
        setExpandedImages([...expandedImages, fileName]);
        if (images[fileName].annotations) {
          Promise.all(
            images[fileName].annotations.map((annotationId: string) => fetchAnnotations(annotationId))
          ).then();
        }
      }
    }
  };

  const toggleSubRow = (annotationId: string) => {
    if (expandedAnnotations.includes(annotationId)) {
      setExpandedAnnotations(expandedAnnotations.filter((row) => row !== annotationId));
    } else {
      setExpandedAnnotations([...expandedAnnotations, annotationId]);
    }
  };

  const handleAnnotationsDelete = async(fileName:string, annotationsId: string)=>{
    try {
      const formData = new FormData();
      formData.append('annotation_id',annotationsId)
      const response = await fetch(`/api/annotations/`,{method:'DELETE', body:formData});
      if (!response.ok){
        throw new Error("failed to delete annotation");
      }
      invalidateAnnotations(annotationsId);
      setImages((prevImages) => {
          const newImages = {...prevImages};
          const annotations = newImages[fileName].annotations;
          const idx = annotations.indexOf(annotationsId);
          delete newImages[fileName].annotations[idx];
          return newImages
        });
    }catch (error){
      console.error(`Error deleting ${annotationsId}: ${(error as Error).message}`);
    }
  };

  const handleImageDelete = async(fileName:string)=>{
    if (images && images[fileName]){
      try {
        const imageId = images[fileName].id;
        const formData = new FormData();
        formData.append('file_id',imageId);
        const response = await fetch(`/api/images/`, {method: 'DELETE', body:formData});
        if (!response.ok) {
          throw new Error("failed to delete image");
        }
        setExpandedImages(expandedImages.filter((row) => row !== fileName));
        setImages((prevImages) => {
          const newImages = {...prevImages};
          delete newImages[fileName];
          return newImages;
        });
      } catch (error) {
        console.error(`Error deleting ${fileName}: ${(error as Error).message}`);
      }
    }
  }
  

  interface ActiveRow {
    key: string;
    firstLevel: string|null;
    firstLevelFlag: boolean;
    secondLevel: string|null;
    secondLevelFlag: boolean;
    thirdLevel: string|null;
    thirdLevelFlag: boolean;
    fourthLevel: string|null;
    fourthLevelFlag: boolean;
    fifthLevel: string|null;
    fifthLevelFlag: boolean;
    format: string;
    toggleFunction: MouseEventHandler;
    deleteFunction: MouseEventHandler;
  }

  function activeRows(): ActiveRow[] {
  const entries: ActiveRow[] = [];
    for (const fileName in images) {
    entries.push({
        key: fileName,
        firstLevel: fileName,
        firstLevelFlag: true,
        secondLevel: null,
        secondLevelFlag: false,
        thirdLevel: null,
        thirdLevelFlag: false,
        fourthLevel: null,
        fourthLevelFlag: false,
        fifthLevel: null,
        fifthLevelFlag: true,
        format: " bg-none  border-b-2 border-zinc-400 shadow-2xl",
        toggleFunction: ()=>toggleRow(fileName),
        deleteFunction: ()=>handleImageDelete(fileName),
      })
    if (expandedImages.includes(fileName)){
      const image = images[fileName].annotations;
      for (const annIdx in image){
        const annotationId = image[annIdx];
        entries.push({
          key: fileName+annotationId,
          firstLevel: fileName,
          firstLevelFlag: false,
          secondLevel: annotationId,
          secondLevelFlag: true,
          thirdLevel: null,
          thirdLevelFlag: false,
          fourthLevel: null,
          fourthLevelFlag: false,
          fifthLevel: null,
          fifthLevelFlag: true,
          format: " bg-none rounded-bl-xl border-b-2 border-zinc-200 shadow-2xl",
          toggleFunction: ()=>toggleSubRow(annotationId),
          deleteFunction: ()=>handleAnnotationsDelete(fileName, annotationId),
        })
        if (expandedAnnotations.includes(annotationId)){
          const annotation = annotations[annotationId];
          for (const ann in annotation){
            const data = annotation[ann].toString();
            entries.push({
              key: fileName+annotationId+ann+data,
              firstLevel: fileName,
              firstLevelFlag: false,
              secondLevel: annotationId,
              secondLevelFlag: false,
              thirdLevel: ann+" : ",
              thirdLevelFlag: true,
              fourthLevel: "[" + data.replaceAll(",",", ") + "]",
              fourthLevelFlag: true,
              fifthLevel: null,
              fifthLevelFlag: false,
              format: " bg-none",
              toggleFunction: ()=>{},
              deleteFunction: ()=>{},
            })
          }
        }
      }
    }
  }

  return entries;
}

  if (!images) return <LoadingCircle></LoadingCircle>;

  return (
      <div className="min-h-screen content-center p-7">
        <div className={"grid content-evenly justify-center text-center"}>
          <div className={"flex flex-col h-[85vh] w-[70vw]"}>
              <div className={"flex-none"}>
                <table className="table-auto w-full text-left border-b-2 border-zinc-900 bg-none">
                  <thead className={"sticky top-0 font-extralight"}>
                  <tr className={"shadow-2xl"}>
                    <th className="w-1/5 px-6 py-1">
                      Image
                    </th>
                    <th className="px-6 py-1">
                      Annotation
                    </th>
                    <th className={"px-6 py-1"}></th>
                    <th className={"px-6 py-1"}></th>
                    <th className={"w-1/12 px-6 py-1"}></th>
                  </tr>
                  </thead>
                </table>
              </div>
              <div className={"flex-grow"}>
                <div className="overflow-y-auto overflow-x-hidden max-h-[80vh] scrollbar-hidden">
                  <table className="w-full text-left">
                    <tbody>
                    {activeRows().map((row) => (
                        <tr key={row.key} className={"font-semibold max-h-2 overflow-hidden" + row.format} onClick={row.toggleFunction}>
                          <td className="w-1/6 px-4 py-2 overflow-hidden">
                            <p className={"truncate text-ellipsis"}>{row.firstLevelFlag && row.firstLevel}</p>
                          </td>
                          <td className="px-4 py-2 overflow-hidden">{row.secondLevelFlag && row.secondLevel}</td>
                          <td className="w-1/6 px-4 py-2 overflow-hidden">{row.thirdLevelFlag && row.thirdLevel}</td>
                          <td className="px-4 py-2 overflow-hidden">{row.fourthLevelFlag && row.fourthLevel}</td>
                          <td className={"w-1/12 px-4 py-2"}>
                            {row.fifthLevelFlag &&
                                <i className="fas fa-trash-alt text-red-500" onClick={row.deleteFunction}></i>}
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className={'grid content-center justify-center'}><ExportButton></ExportButton></div>
        </div>
        )
        };

        export default DatabasePage;
