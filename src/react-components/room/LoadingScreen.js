import React from "react";
import PropTypes from "prop-types";
import { LoadingScreenLayout } from "../layout/LoadingScreenLayout";
import { Spinner } from "../misc/Spinner";
import { useRandomMessageTransition } from "./useRandomMessageTransition";
export function LoadingScreen({ message }) {
  return (
    <LoadingScreenLayout
      center={
        <>
          <Spinner />
          <p>{message}</p>
        </>
      }
    />
  );
}

LoadingScreen.propTypes = {
  message: PropTypes.node,
};
