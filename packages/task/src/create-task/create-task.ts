import axios, { AxiosResponse } from "axios";
import { followHalJson } from "@dvelop-sdk/axios-hal-json";
import { Task } from "../task";
import { v4 } from "uuid";
import { InvalidTaskError, UnauthenticatedError, UnauthorizedError } from "../errors";
axios.interceptors.request.use(followHalJson);


/**
 * Creates a [Task]{@link Task} and returns it. This method will automatically generate a random correlation key if the task does not contain one.
 *
 * @throws [[InvalidTaskError]] indicates that the given task was not accepted because it is invalid. You can check the ```error.validation```-property.
 * @throws [[UnauthenticatedError]] indicates that the authSessionId was invalid or expired.
 * @throws [[UnauthorizedError]] indicates that the user associated with the authSessionId does miss permissions.
 *
 * @param {string} systemBaseUri SystemBaseUri for the tenant
 * @param {string} authRessionId Vaild AuthSessionId
 * @param {Task} task Task to be created
 * @returns {Task} Created Task
 *
 * @example ```typescript
 * const task: Task = {
 *   subject: "Cover up lab accident",
 *   assignees: ["USER_ID_1", "USER_ID_2"],
 *   correlationKey: "everythingIsFine", // can be randomly generated
 * }
 * task = await createTask("https://umbrella-corp.d-velop.cloud", "AUTH_SESSION_ID ", task);
 * ```
 */
export async function createTask(systemBaseUri: string, authSessionId: string, task: Task): Promise<Task> {

  const errorContext: string = "Failed to create task";

  if (!task.correlationKey) {
    task.correlationKey = v4();
  }

  try {
    const response: AxiosResponse = await axios.post<Task>("/task", task, {
      baseURL: systemBaseUri,
      headers: {
        "Authorization": `Bearer ${authSessionId}`,
        "Origin": systemBaseUri
      },
      follows: ["tasks"]
    });

    const location: string = response.headers.location;
    let createdTask: Task = { ...task, location: location };
    return createdTask;

  } catch (e) {
    if (e.response) {
      switch (e.response.status) {
      case 400:
        throw new InvalidTaskError(errorContext, task, e.response.data, e.response);
      case 401:
        throw new UnauthenticatedError(errorContext, e.response);
      case 403:
        throw new UnauthorizedError(errorContext, e.response);
      }
    }
    e.message = `${errorContext}: ${e.message}`;
    throw e;
  }

}