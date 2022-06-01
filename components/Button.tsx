import { Button as CButton, ButtonProps } from "@chakra-ui/react";

const Button = (props: ButtonProps) => (
  <CButton colorScheme={"blue"} {...props} />
);

export default Button;
