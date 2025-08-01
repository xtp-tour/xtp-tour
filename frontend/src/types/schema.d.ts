/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
    "/api/error": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["errorHandler-fm"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/events/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get list of events that belong to the user */
        get: operations["listEventsHandler-fm"];
        put?: never;
        /** Create an event */
        post: operations["createEventHandler-fm"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/events/joined": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get list of events that the user joined */
        get: operations["listJoinedEventsHandler-fm"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/events/public": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get list of public events */
        get: operations["listPublicEventsHandler-fm"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/events/public/{eventId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get public event by id */
        get: operations["getPublicEventHandler-fm"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/events/public/{eventId}/joins": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Join an event */
        post: operations["joinEventHandler-fm"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/events/public/{eventId}/joins/{joinRequestId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Cancel join request */
        delete: operations["cancelJoinRequest-fm"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/events/{eventId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get event by id */
        get: operations["getMyEventHandler-fm"];
        put?: never;
        post?: never;
        /** Delete event by id */
        delete: operations["deleteEventHandler-fm"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/events/{eventId}/confirmation": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Confirm event */
        post: operations["confirmEvent-fm"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/locations/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get list of locations */
        get: operations["listLocationsHandler-fm"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/profiles/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create user profile */
        post: operations["createUserProfileHandler-fm"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/profiles/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get user profile */
        get: operations["getMyProfileHandler-fm"];
        /** Update user profile */
        put: operations["updateUserProfileHandler-fm"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/profiles/{user}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get user profile */
        get: operations["getUserProfileHandler-fm"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ping": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["healthHandler-fm"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        ApiConfirmation: {
            /**
             * Format: date
             * @description Creation timestamp in UTC in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
             */
            createdAt?: string;
            /**
             * Format: date
             * @description Confirmed date and time in UTC in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
             */
            datetime?: string;
            eventId?: string;
            location?: string;
        };
        ApiCoordinates: {
            /**
             * Format: double
             * @description Latitude coordinate
             */
            latitude?: number;
            /**
             * Format: double
             * @description Longitude coordinate
             */
            longitude?: number;
        };
        ApiCreateEventResponse: {
            event?: components["schemas"]["ApiEvent"];
        };
        ApiCreateUserProfileResponse: {
            profile?: components["schemas"]["ApiUserProfileData"];
        };
        ApiEvent: {
            confirmation?: components["schemas"]["ApiConfirmation"];
            /**
             * Format: date
             * @description Creation timestamp in UTC in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
             */
            createdAt?: string;
            description?: string;
            /** @enum {string} */
            eventType: "MATCH" | "TRAINING";
            /** Format: int32 */
            expectedPlayers: number;
            /** @description Expiration time in UTC in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ) */
            expirationTime?: string;
            id?: string;
            joinRequests?: components["schemas"]["ApiJoinRequest"][];
            locations: string[];
            /**
             * Format: int32
             * @description Session duration in minutes
             */
            sessionDuration: number;
            /** @enum {string} */
            skillLevel: "ANY" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
            /** @enum {string} */
            status?: "OPEN" | "ACCEPTED" | "CONFIRMED" | "CANCELLED" | "RESERVATION_FAILED" | "COMPLETED";
            /** @description Time slots in UTC in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ) */
            timeSlots: string[];
            userId?: string;
            /** @enum {string} */
            visibility: "PUBLIC" | "PRIVATE";
        };
        ApiEventConfirmationResponse: {
            confirmation?: components["schemas"]["ApiConfirmation"];
        };
        ApiEventData: {
            description?: string;
            /** @enum {string} */
            eventType: "MATCH" | "TRAINING";
            /** Format: int32 */
            expectedPlayers: number;
            /** @description Expiration time in UTC in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ) */
            expirationTime?: string;
            id?: string;
            locations: string[];
            /**
             * Format: int32
             * @description Session duration in minutes
             */
            sessionDuration: number;
            /** @enum {string} */
            skillLevel: "ANY" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
            /** @description Time slots in UTC in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ) */
            timeSlots: string[];
            userId?: string;
            /** @enum {string} */
            visibility: "PUBLIC" | "PRIVATE";
        };
        ApiGetEventResponse: {
            event?: components["schemas"]["ApiEvent"];
        };
        ApiGetUserProfileResponse: {
            profile?: components["schemas"]["ApiUserProfileData"];
        };
        ApiHealthResponse: {
            message?: string;
            service?: string;
            status?: string;
        };
        ApiJoinRequest: {
            comment?: string;
            /**
             * Format: date
             * @description Creation timestamp in UTC in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
             */
            createdAt?: string;
            eventId?: string;
            id?: string;
            isRejected?: boolean | null;
            locations: string[];
            /** @description Time slots in UTC in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ) */
            timeSlots: string[];
            userId?: string;
        };
        ApiJoinRequestData: {
            comment?: string;
            eventId?: string;
            id?: string;
            locations: string[];
            /** @description Time slots in UTC in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ) */
            timeSlots: string[];
        };
        ApiJoinRequestResponse: {
            joinRequest?: components["schemas"]["ApiJoinRequest"];
        };
        ApiListEventsResponse: {
            events?: components["schemas"]["ApiEvent"][];
            /** Format: int32 */
            total?: number;
        };
        ApiListLocationsResponse: {
            locations?: components["schemas"]["ApiLocation"][];
        };
        ApiLocation: {
            address?: string;
            coordinates?: components["schemas"]["ApiCoordinates"];
            id?: string;
            name?: string;
        };
        ApiUpdateUserProfileResponse: {
            profile?: components["schemas"]["ApiUserProfileData"];
        };
        ApiUserProfileData: {
            firstName?: string;
            lastName?: string;
            /** Format: double */
            ntrpLevel?: number;
            preferredCity?: string;
            userId?: string;
        };
        "ConfirmEvent-FmInput": {
            /**
             * Format: date
             * @description Event date and time in UTC in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
             */
            datetime: string;
            joinRequestsIds: string[];
            locationId: string;
        };
        "CreateEventHandler-FmInput": {
            event: components["schemas"]["ApiEventData"];
        };
        "CreateUserProfileHandler-FmInput": {
            firstName?: string;
            lastName?: string;
            /** Format: double */
            ntrpLevel?: number;
            preferredCity?: string;
        };
        "JoinEventHandler-FmInput": {
            joinRequest: components["schemas"]["ApiJoinRequestData"];
        };
        "UpdateUserProfileHandler-FmInput": {
            firstName?: string;
            lastName?: string;
            /** Format: double */
            ntrpLevel?: number;
            preferredCity?: string;
            userId?: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    "errorHandler-fm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "listEventsHandler-fm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiListEventsResponse"];
                };
            };
        };
    };
    "createEventHandler-fm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["CreateEventHandler-FmInput"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiCreateEventResponse"];
                };
            };
        };
    };
    "listJoinedEventsHandler-fm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiListEventsResponse"];
                };
            };
        };
    };
    "listPublicEventsHandler-fm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiListEventsResponse"];
                };
            };
        };
    };
    "getPublicEventHandler-fm": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                eventId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiGetEventResponse"];
                };
            };
        };
    };
    "joinEventHandler-fm": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                eventId: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["JoinEventHandler-FmInput"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiJoinRequestResponse"];
                };
            };
        };
    };
    "cancelJoinRequest-fm": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                eventId: string;
                joinRequestId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "getMyEventHandler-fm": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                eventId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiGetEventResponse"];
                };
            };
        };
    };
    "deleteEventHandler-fm": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                eventId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "confirmEvent-fm": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                eventId: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["ConfirmEvent-FmInput"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiEventConfirmationResponse"];
                };
            };
        };
    };
    "listLocationsHandler-fm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiListLocationsResponse"];
                };
            };
        };
    };
    "createUserProfileHandler-fm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["CreateUserProfileHandler-FmInput"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiCreateUserProfileResponse"];
                };
            };
        };
    };
    "getMyProfileHandler-fm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiGetUserProfileResponse"];
                };
            };
        };
    };
    "updateUserProfileHandler-fm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["UpdateUserProfileHandler-FmInput"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiUpdateUserProfileResponse"];
                };
            };
        };
    };
    "getUserProfileHandler-fm": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                user: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiGetUserProfileResponse"];
                };
            };
        };
    };
    "healthHandler-fm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiHealthResponse"];
                };
            };
        };
    };
}
