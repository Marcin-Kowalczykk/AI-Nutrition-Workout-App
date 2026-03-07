import CenterWrapper from "./center-wrapper";

interface ErrorComponentProps {
  error: Error;
}

export const ErrorComponent = ({ error }: ErrorComponentProps) => {
  return (
    <CenterWrapper className="w-full items-center justify-center xl:w-1/2 text-center">
      <div className="text-primary-element">
        Error: {error.message || "Failed to load data"}
      </div>
    </CenterWrapper>
  );
};
