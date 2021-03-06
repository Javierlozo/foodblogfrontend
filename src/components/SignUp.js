import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import SetUsername from "../components/signup/SetUsername";
import ConfirmSignUp from "../components/signup/ConfirmSignUp";
import SetBio from "../components/signup/SetBio";
import ProfilePic from "../components/signup/ProfilePic";
import { Auth, Storage } from "aws-amplify";
import { navigate } from "@reach/router";
import { v4 as uuid } from "uuid";
import axios from "axios";

const useStyles = makeStyles(theme => ({
  root: {
    width: "100%"
  },
  backButton: {
    marginRight: theme.spacing(1)
  },
  instructions: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1)
  }
}));

function getSteps() {
  return [
    "Create Username and Password",
    "Upload profile pic",
    "Write Bio",
    "Confirm Sign Up"
  ];
}

function getStepContent(stepIndex, signUpForm, setSignUpForm) {
  switch (stepIndex) {
    case 0:
      return (
        <SetUsername signUpForm={signUpForm} setSignUpForm={setSignUpForm} />
      );
    case 1:
      return (
        <ProfilePic signUpForm={signUpForm} setSignUpForm={setSignUpForm} />
      );
    case 2:
      return <SetBio signUpForm={signUpForm} setSignUpForm={setSignUpForm} />;
    case 3:
      return (
        <ConfirmSignUp signUpForm={signUpForm} setSignUpForm={setSignUpForm} />
      );
    default:
      return "Unknown stepIndex";
  }
}

export default function SignUp() {
  const classes = useStyles();
  const [activeStep, setActiveStep] = React.useState(0);
  const steps = getSteps();

  const [signUpForm, setSignUpForm] = React.useState({
    username: "",
    password: "",
    profilePic: undefined,
    bio: "",
    confirmationCode: ""
  });
  console.log(signUpForm);

  const [signUpUser, setSignUpUser] = React.useState(undefined);
  console.log("signed up user", signUpUser);

  function renderButton() {
    if (activeStep === steps.length - 1) {
      return (
        <Button variant="contained" color="primary" onClick={handleConfirmUser}>
          Confirm
        </Button>
      );
    } else {
      return (
        <Button variant="contained" color="primary" onClick={handleNext}>
          Next
        </Button>
      );
    }
  }

  const handleNext = () => {
    setActiveStep(prevActiveStep => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };

  const handleCreateUser = () => {
    try {
      async function signUp() {
        const user = await Auth.signUp({
          username: signUpForm.username,
          password: signUpForm.password,
          attributes: {
            email: signUpForm.username
          }
        });
        setSignUpUser(user);
      }
      signUp();
      handleNext();
    } catch (error) {
      console.log(error);
    }
  };
  //https://7cayqhu9ff.execute-api.us-east-1.amazonaws.com/dev/user?secret=supersecret
  async function handleConfirmUser() {
    async function uploadToSql(uuid) {
      console.log("upload to mysql");
      return await axios({
        method: "post",
        url:
          "https://7cayqhu9ff.execute-api.us-east-1.amazonaws.com/dev/user?secret=supersecret",
        data: {
          username: signUpForm.username,
          profilepic: uuid,
          bio: signUpForm.bio
        }
      });
    }

    try {
      const response = await Auth.confirmSignUp(
        signUpForm.username,
        signUpForm.confirmationCode
      );
      // prompt(response);
      if (response === "SUCCESS") {
        const myUuid = uuid();
        Storage.put(
          `${signUpForm.username}/profilepics/${myUuid}.png`,
          signUpForm.profilePic,
          {
            contentType: "image/png"
          }
        )
          .then(result => console.log(result))
          .then(() => uploadToSql(myUuid))
          .then(() => navigate("/"))
          .catch(err => console.log(err));
      }
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className={classes.root}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map(label => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <div>
        <div>
          <Typography className={classes.instructions}>
            {getStepContent(activeStep, signUpForm, setSignUpForm)}{" "}
          </Typography>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            className={classes.backButton}
          >
            Back
          </Button>
          {activeStep === steps.length - 2 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateUser}
            >
              Create User
            </Button>
          ) : (
            renderButton()
          )}
        </div>
      </div>
    </div>
  );
}
