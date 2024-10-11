export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-100 text-gray-800 p-1 flex flex-col items-center justify-center">
      <h1 className="text-5xl font-extrabold mb-10 text-center">
        Welcome to <span className="text-blue-600">AnnotationsApp</span>
      </h1>

      <p className="text-lg mb-6 text-gray-600 text-center max-w-2xl">
        This app helps you manage and annotate images effortlessly. You can upload your images and annotations, visualize your data, and create detailed annotations using lines, points, and polygons.
      </p>

      <div className="space-y-6 w-full max-w-lg">
        <a href="/upload" className="block">
          <button className="w-full bg-zinc-900 text-white py-4 px-6 rounded-lg flex items-center justify-between shadow-lg hover:bg-zinc-800 transition">
            <div className="flex items-center">
              <i className="fas fa-upload text-white mr-4 text-2xl"></i>
              <span className="text-xl font-semibold">Upload</span>
            </div>
            <p className="text-sm text-gray-300">Load images and annotations</p>
          </button>
        </a>

        <a href="/database" className="block">
          <button className="w-full bg-zinc-900 text-white py-4 px-6 rounded-lg flex items-center justify-between shadow-lg hover:bg-zinc-800 transition">
            <div className="flex items-center">
              <i className="fas fa-database text-white mr-4 text-2xl"></i>
              <span className="text-xl font-semibold">Database</span>
            </div>
            <p className="text-sm text-gray-300">Visualize stored images and data</p>
          </button>
        </a>

        <a href="/annotations" className="block">
          <button className="w-full bg-zinc-900 text-white py-4 px-6 rounded-lg flex items-center justify-between shadow-lg hover:bg-zinc-800 transition">
            <div className="flex items-center">
              <i className="fas fa-pen-fancy text-white mr-4 text-2xl"></i>
              <span className="text-xl font-semibold">Annotations</span>
            </div>
            <p className="text-sm text-gray-300">Draw and save annotations</p>
          </button>
        </a>
      </div>
    </div>
  );
}


