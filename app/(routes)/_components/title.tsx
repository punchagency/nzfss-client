"use client"
import { useUser } from "@/context/user_context";
import { RootState } from "@/redux/store";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const Title = () => {
  const {user} = useUser()
  return (
    <div className="flex flex-col gap-y-[8px]">
      <span className="font-[500] 2xl:text-[1rem] 3xl:text-[1.125rem]">Welcome back</span>
      <h2 className="font-[700] text-[1.8rem] leading-[33.6px]">
        {user?.name}
      </h2>
    </div>
  );
};

export default Title;
