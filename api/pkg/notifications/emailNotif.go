package notifications

import "context"

type emailSender struct {
}

func (e *emailSender) Send(ctx context.Context, topic string, msg string, address string) error {
	return nil
}
