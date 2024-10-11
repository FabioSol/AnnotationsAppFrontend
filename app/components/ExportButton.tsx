import React, { useState } from 'react';

function ExportButton() {
  const [isDownloading, setIsDownloading] = useState(false);
  const handleExportClick = async () => {
    setIsDownloading(true);

    try {
      const response = await fetch(`/api/export_data`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Error downloading data:`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'export.zip';
      link.click();

      window.URL.revokeObjectURL(url); // Clean up temporary URL
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button className={'bg-blue-600 text-background w-fit m-2 border-2 rounded-2xl px-3  py-2 font-bold'} disabled={isDownloading} onClick={handleExportClick}>
      {isDownloading ? 'Downloading...' : 'Export Data'}
    </button>
  );
}

export default ExportButton;