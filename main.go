package main

import (
	"context"
	"dispo/backend/httpclient"
	"dispo/backend/scripting"
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	httpService := httpclient.NewHTTPService()
	scriptService := scripting.NewService()

	err := wails.Run(&options.App{
		Title:     "dispo",
		Width:     1440,
		Height:    900,
		MinWidth:  1100,
		MinHeight: 700,
		BackgroundColour: &options.RGBA{
			R: 0,
			G: 0,
			B: 0,
			A: 1,
		},
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup: func(ctx context.Context) {
			httpService.Startup(ctx)
		},
		Bind: []interface{}{
			httpService,
			scriptService,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
