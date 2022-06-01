import { Alert, AlertDescription, AlertIcon } from "@chakra-ui/react";

const ErrorMessage = ({ error }) => {
  return error ? (
    <Alert status="error">
      <AlertIcon />
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  ) : null;
};

export default ErrorMessage;
