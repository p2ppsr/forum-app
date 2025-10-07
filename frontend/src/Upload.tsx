import React from "react";
import { uploadMessage } from "./utils/uploadStory";

export default function Upload() {
  const upload = async () => {
    await uploadMessage();
  };

  return (
    <div>
      <h1>Upload</h1>
      <button onClick={upload}>Upload</button>
    </div>
  );
};
