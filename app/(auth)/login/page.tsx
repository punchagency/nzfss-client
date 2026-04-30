import Image from "next/image";
import Login from "../_components/login";
import { HeroFrame } from "@/assets";

const LoginPage = () => {
  return (
    <div className="p-4 h-screen overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-2rem)]">
        <Login />
        <div className="hidden lg:flex justify-center items-center overflow-hidden pb-8">
          <Image
            className="max-h-full max-w-full object-contain rounded-[20px]"
            src={HeroFrame}
            alt="New Zealand Federation of Sled Dog Sports"
            priority
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
