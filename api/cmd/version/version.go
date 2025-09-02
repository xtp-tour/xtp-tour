package version

import (
	"fmt"
	"log/slog"
	"os"
	"strings"
)

// Minor version is autoupdated by the build system
// NOTE: use go build -ldflags "-X github.com/xtp-tour/xtp-tour/api/cmd/version.Version==$(git describe)"
var Version = "v0.0.debug"

// ProcessVersionArgument checks whether the version argument
// is present and if yes prints version and exits with 0 code
func ProcessVersionArgument(serviceName string, args []string, version string) {
	if len(os.Args) == 2 && (strings.EqualFold(os.Args[1], "version") || strings.EqualFold(strings.TrimLeft(os.Args[1], "-"), "version")) {
		fmt.Println(serviceName + " Version: " + version)
		os.Exit(0)
	}

	slog.Info("Starting " + serviceName + " Version: " + version)
}
