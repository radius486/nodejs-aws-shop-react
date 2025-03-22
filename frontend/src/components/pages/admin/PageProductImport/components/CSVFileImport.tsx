import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import axios, { AxiosError } from "axios";
import { enqueueSnackbar } from "notistack";
import { s } from "msw/lib/glossary-58eca5a8";

type CSVFileImportProps = {
  url: string;
  title: string;
};

export default function CSVFileImport({ url, title }: CSVFileImportProps) {
  const [file, setFile] = React.useState<File>();

  const authToken = localStorage.getItem("authorization_token")
  let headers: any = {}

  if (authToken) {
    headers.Authorization = `Basic ${localStorage.getItem("authorization_token")}`;
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFile(file);
    }
  };

  const removeFile = () => {
    setFile(undefined);
  };

  const uploadFile = async () => {
    console.log("uploadFile to", url);

    try {
      // Get the presigned URL
      const response = await axios({
        method: "GET",
        url,
        headers,
        params: {
          name: encodeURIComponent(file?.name || ''),
        },
      });

      console.log("File to upload: ", file?.name);
      console.log("Uploading to: ", response.data);

      const result = await fetch(response.data, {
        method: "PUT",
        body: file,
      });

      console.log("Result: ", result);
    } catch (error) {
      console.log(error);

      let message = "Something went wrong!";
      let status = 500;

      switch ((error as AxiosError)?.response?.status) {
        case 401:
          message = 'Unauthorized user!';
          status = 401;
          break;
        case 403:
          message = 'User credentials are incorrect!';
          status = 403;
          break;
        case 500:
          message = 'Something went wrong!';
          status = 500;
          break;
      }

      enqueueSnackbar({
        message: `${status}, ${message}`,
        variant: "error",
        anchorOrigin: {
          vertical: "top",
          horizontal: "left",
        }
      });
    }

    setFile(undefined);
  };
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {!file ? (
        <input type="file" onChange={onFileChange} />
      ) : (
        <div>
          <button onClick={removeFile}>Remove file</button>
          <button onClick={uploadFile}>Upload file</button>
        </div>
      )}
    </Box>
  );
}
