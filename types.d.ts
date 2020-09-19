type SearchParams = {
  branch: string;
  "start-date": string;
};

type ProjectConfig = {
  channels: string[];
  branch?: string;
  workflow?: string;
};

type Project = ProjectConfig & {
  id: string;
  endpointUrl: string;
  pipelineUrl: string;
};

type ProjectMap = Record<string, ProjectConfig>;

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
