import BackgroundImage from "@/components/shared/background-image";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="h-full w-full flex flex-col bg-black items-start justify-start overflow-y-auto">
      <div className="w-full flex flex-col lg:flex-row lg:justify-center lg:items-start grow gap-4 p-4 pt-8 md:pt-12 lg:pt-4">
        <div className="w-full lg:max-w-md">{children}</div>
      </div>
      <BackgroundImage
        imagePath="/images/auth-bg.jpeg"
        className="w-full flex-1 min-h-80 md:min-h-96 lg:h-96 lg:flex-none"
        fallbackClassName="bg-black"
      />
    </div>
  );
};

export default AuthLayout;
