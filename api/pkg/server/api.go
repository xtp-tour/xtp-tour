package server

type GetChallengesRequest struct {
	Id string `path:"id" validate:"required"`
}

type ListChallengesResponse struct {
	Challenges map[string]string `json:"challenges"`
}

type GetChallengesResponse struct {
	Result string
}

type ThingPutRequest struct {
	Name  string `path:"name" validate:"required"`
	Value string `json:"value" validate:"required"`
}

type ThingPutResponse struct {
}
