type SearchParams = {
  branch: string;
  "start-date": string;
};

type Project = {
  branch?: string;
  workflow?: string;
  channels: string[];
};

type ProjectMap = Record<string, Project>;

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
