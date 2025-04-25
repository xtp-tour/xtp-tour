---
description: 
globs: 
alwaysApply: true
---
## Project Structure
This is a full-stack application with a Go backend and TypeScript/React frontend. The project is organized into two main directories:
- `api/` for the backend
- `frontend/` for the frontend application

## Backend Structure
The backend (`api/`) follows standard Go project layout:
- `cmd/`: Contains the main applications
- `pkg/`: Contains library code that can be used by external applications
- `test/`: Contains integration test for API and test data
- `bin/`: Contains compiled binaries
- `.data/`: Contains data files that are not part of the source code
- `.tmp/`: Contains temporary files that are not part of the source code

## Frontend Structure
The frontend (`frontend/`) is a TypeScript/React application using Vite:
- `src/`: Contains the source code
- `public/`: Contains static assets
- `dist/`: Contains build output
- `node_modules/`: Contains dependencies

## Development Workflow
- Backend: Use `make` commands in `api/` directory for development
- Frontend: Use `make` commands in `frontend/` directory for development
- Frontend uses pnpm as a package manager
- Backend uses Mysql database which can be run using Docker Compose from the `api/` directory

## Code Style Guidelines
- Backend: Follow Go standard formatting (gofmt)
- Frontend: Follow TypeScript/React best practices and use ESLint for linting

## Testing Guidelines
- Backend: Write tests integration tests in the `api/test/` directory and unit test in the go conventional way
- Frontend: Write tests alongside the components they test

## Environment Setup
- Backend: Use `.envrc.example` as a template for environment variables
- Frontend: Environment variables are configured in `vite.config.ts` 


## Application logic 

This application is a calendly for those who play racket sports like tennis. It allows creating and evend and sharing it either publickly or with certain people via link or sharing options.
Othe people may join the event and application manages the event joining lifecycle.


// Here is the flow: 
// 1. UserA creates an event. This event is become visible to other players.
// 1.1 UserA can cancel his own event at any point before confirmation.
// 2. Users can send acks to the event selecting time slots and places that are available to them. Lets assume that UserB and UserC send their acks.
// 3. Those acks are visible to UserA. UserA can now select one of the acks and confirm the reservation.
// 4. UserA selects the ack of UserB. User A must make a reservation at the mutually agreed location and time. After reservation userA commits the ack of userB.
// 4.1 If userA fails to make a reservation then Acks transitions into ReservationFailed state.
// 5. UserC ack transitions into rejected state. 
// 6. After the game date/time has passed, the event transitions to Completed state.
// On that step the flow of the invitation is completed.
