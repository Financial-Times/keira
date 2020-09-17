type Config = {
  projects: Projects;
  params: {
    branch: string;
    "start-date": string;
  };
};

type Project = {
  channels: string[];
};

type Projects = Record<string, Project>;

type Item = {
  status: string;
};

type ResultData = {
  items: Item[];
};

type ResultErr = {
  message: string;
};

type Result = ResultData | ResultErr;
