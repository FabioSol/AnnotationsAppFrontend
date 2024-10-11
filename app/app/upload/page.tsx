'use client';

import JSZip from 'jszip';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useState } from 'react';

const UploadPage = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[] | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: File[] = [];

    for (const file of acceptedFiles) {
        console.log(`Processing file: ${file.name}, type: ${file.type}`); // Debug log for dropped files
        const isZipFile = file.name.toLowerCase().endsWith('.zip');
        if (isZipFile) {
            // If the file is a zip, decompress it
            const zip = await JSZip.loadAsync(file);
            const zipFolderName = file.name.split('.').slice(0, -1).join('.'); // Get the name of the zip file without extension

            // Iterate through the zip file and extract all files
            await Promise.all(
              Object.keys(zip.files).map(async (filename) => {
                  const zipFile = zip.files[filename];
                  if (!zipFile.dir) { // Only process files, not folders
                      const content = await zipFile.async('blob'); // Extract the file content
                      const fileType = getFileTypeFromName(filename);

                  if (fileType) {
                    // Create a new file with the zip's name appended
                      const newFile = new File([content], `${zipFolderName}_${filename}`, { type: fileType });
                      newFiles.push(newFile);
                  }
                }
              })
            );
          } else {
            // For regular files, just push them into the array
            newFiles.push(file);
          }
    }

    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': [], // Accepts all image types
      'text/plain': [], // Accepts .txt files
      'application/zip': ['.zip'] // Accepts .zip files
    },
    multiple: true,
  });

  // Helper function to determine the file type based on the file name
  const getFileTypeFromName = (filename: string) => {
    const extension = filename.split('.')?.pop()?.toLowerCase();
    switch (extension) {
      case 'png':
      case 'jpg':
      case 'jpeg':
        return `image/${extension}`;
      case 'txt':
        return 'text/plain';
      default:
        return null;
    }
  };

  const handleNameChange = (index: number, newName: string) => {
    const updatedFiles = [...files];
    updatedFiles[index] = new File([updatedFiles[index]], newName, { type: updatedFiles[index].type });
    setFiles(updatedFiles);
  };
  const handleDelete = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
  };

  const handleUploadImage = async(image: File): Promise<[string, string|null]> => {
    if (image.type.startsWith('image/')){
      const formData = new FormData();

      formData.append('image', image);
      formData.append('name', image.name);
      try {
      // Upload the image
      const imageResponse = await fetch(`/api/images/`, {
        method: 'POST',
        body: formData,
      });

      if (!imageResponse.ok) {
        throw new Error(`Failed to upload image ${image.name}`);
      }

      const imageData = await imageResponse.json();
      const fileId = imageData.file_id; // Get the file ID from the image upload response

      console.log(`Uploaded image ${image.name} with file ID ${fileId}`);
      return [image.name, fileId];

    } catch (error) {
          console.error(`Error uploading image ${image.name}: ${(error as Error).message}`);
    }
    }
    return ([image.name, null]);
  };

  const handleUploadAnnotations = async(annotations: File, fileId:string): Promise<[string, string|null]> => {
      if (annotations.type.startsWith('text/')){
          try {
              const annotationsText = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result as string);
                  reader.onerror = () => reject(reader.error);
                  reader.readAsText(annotations);
              });

              const annotationData = {
                  file_id: fileId, // Use the file_id for the corresponding file
                  data: JSON.parse(annotationsText.replaceAll("'","\"")),
              };
              const annotationsResponse = await fetch(`/api/annotations/`, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(annotationData),
              })
              if (!annotationsResponse.ok) {
                throw new Error(`Failed to upload text file ${annotations.name}`);
              }
              return ([annotations.name, "200"])
          } catch (error) {
              console.error(`Error uploading text file ${annotations.name}: ${(error as Error).message}`);
          }

      }
      return ([annotations.name, null])
  };

  const handleUploadPairs = async(image: File): Promise<string[]|undefined> =>{
      const [fullFileName, fileId]  = await handleUploadImage(image);

      if (fileId) {
          let uploads:string[] = [fullFileName];

          const fileName = fullFileName.split('.').slice(0, -1).join('.');
          const textFiles = files.filter(file => (file.name.split('.').slice(0, -1).join('.') === fileName && file.type === 'text/plain'));
          if (textFiles.length > 0) {
              for (const textId in textFiles){
                  const textFile = textFiles[textId];
                  const [textFileName, textFileId] = await handleUploadAnnotations(textFile,fileId);
                  if (textFileId){
                      uploads = [...uploads,textFileName];
                  }
              }
          }
        return (uploads);
      }
  };
  const handleUpload = async () => {
  try {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (!imageFiles.length) {
      console.error("No image files selected");
      return;
    }

    if (!Array.isArray(uploadedFiles)) {
      setUploadedFiles([]);
    }

    const uploads = await Promise.all(
      imageFiles.map(handleUploadPairs)
    );
    const successfulUploads = uploads.filter((x) => x !== null);
    const flatUploads = successfulUploads.flatMap((x) => x).filter((x): x is string => x !== undefined);

    setUploadedFiles(flatUploads);
  } catch (error) {
    console.error("Error uploading files:", error);
  }
};

  return (
    <div className="min-h-screen content-center p-7">
        <div className={"grid gap-4 content-evenly justify-center text-center"}>
            <div>
                <p className={"text-3xl text-zinc-900 font-extrabold"}>Upload files to the database</p>
                <p className={"text-zinc-500"}> .png, .jpg, .txt and exported .zip</p>
            </div>
            <div {...getRootProps()} className={"grid gap-7 content-evenly justify-center place-items-center"}>
                <div className="cursor-pointer bg-blue-600 hover:bg-blue-500 shadow-3xl pt-3 pb-3 rounded-xl text-center text-background text-2xl w-52 font-extrabold">
                    <input {...getInputProps()}  />
                    <p>Select Files</p>
                </div>

                {(files.length < 1 )?
                    (
                        <div className={"rounded-xl border-zinc-300 border-2 h-[40vh] w-[40vw] p-1"}>
                            <div className={"rounded-lg border-dashed border-zinc-300 border-2 h-full text-center text-zinc-400 content-center"}>
                                <p>Or drag and drop here</p>
                            </div>
                        </div>
                    ) :
                    (
                        <div className={"flex flex-col h-[40vh] w-[40vw] rounded-xl border-4 border-zinc-800"}
                             onClick={(e) => e.stopPropagation()} >
                            <div className={""}>
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-zinc-800 text-background">
                                    <tr>
                                        <th className="px-6 py-1">File Name</th>
                                        <th className="text-left">File Type</th>
                                        <th className=""></th>
                                    </tr>
                                    </thead>
                                </table>
                            </div>
                            <div className={"grow"}>
                                <div className="flex overflow-y-auto overflow-x-hidden max-h-[30.7vh] scrollbar-hidden">
                                    <table className="table-auto w-full text-left" >
                                        <tbody>
                                        {files.map((file, index) => (
                                            <tr key={index} className={"text-zinc-600 font-bold"}>
                                                <td className="px-4 py-2">
                                                    <input
                                                        className="border border-zinc-400 p-1 rounded"
                                                        type="text"
                                                        value={file.name}
                                                        onChange={(e) => handleNameChange(index, e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-4 py-2">{file.type}</td>
                                                <td className="px-4 py-2">
                                                    {uploadedFiles == null ? (
                                                    <button className="text-zinc-500 hover:text-zinc-700 font-extrabold"
                                                    onClick={() => handleDelete(index)}>
                                                            &#10005;
                                                        </button>
                                                    ) : (uploadedFiles.includes(file.name) ? (
                                                        <button className="text-green-500 font-extrabold">&#10003;</button>
                                                    ) : (
                                                        <button className="text-red-500 font-extrabold">&#10005;</button>
                                                    ))}

                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-end items-center bg-zinc-800 text-background font-bold p-2 px-4">

                                {uploadedFiles==null?
                                    <button onClick={() => handleUpload()}
                                         className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 px-4 rounded-lg">
                                    Upload {files.length} files
                                    </button>:
                                    <div className={"w-full grid grid-cols-2 gap-3"}>
                                        <button
                                            className="left-0 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-1 px-4 rounded-lg">
                                            <a href={'/upload'}> upload more files <i className={"fas fa-side"}></i></a>
                                        </button>
                                        <button
                                            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-1 px-4 rounded-lg">
                                            <a href={'/database'}>go to Database <i className={"fas fa-side"}></i></a>
                                        </button>
                                    </div>
                                }
                            </div>

                        </div>

                    )
                }
            </div>
        </div>
    </div>
  )
      ;
};

export default UploadPage;
