import axios, { AxiosRequestConfig, AxiosError } from "axios";

type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data: T;
  loading: boolean;
};

const RequestAPI = async <T = unknown,>(
  method: AxiosRequestConfig["method"],
  url: string,
  headers?: Record<string, string>,
  data?: unknown,
): Promise<ApiResponse<T>> => {
  try {
    const config: AxiosRequestConfig = {
      method,
      url,
      headers,
      data,
    };
    const response = await axios(config);
    const result = response.data;

    if (result?.success) {
      return {
        loading: false,
        success: true,
        message: result.message || "",
        data: result.data ?? ({} as T),
      };
    }

    return {
      loading: false,
      success: false,
      message: result?.errors ?? result?.message ?? "No record found.",
      data: {} as T,
    };
  } catch (err) {
    const error = err as AxiosError<any>;

    return {
      loading: false,
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "Something went wrong",
      data: {} as T,
    };
  }
};

export { RequestAPI };
