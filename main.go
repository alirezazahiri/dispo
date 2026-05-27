package main

import (
	"context"
	"dispo/backend/collections"
	"dispo/backend/httpservice"
	importsvc "dispo/backend/import"
	"dispo/backend/scripting"
	"embed"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	collectionsService := collections.NewService()
	importService := importsvc.NewService(collectionsService)
	httpService := httpservice.NewHTTPService()
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
			collectionsService.Startup(ctx)
		},
		OnShutdown: func(ctx context.Context) {
			_ = ctx
			if err := collectionsService.Close(); err != nil {
				log.Printf("failed to close collections service: %v", err)
			}
			if err := httpService.Close(); err != nil {
				log.Printf("failed to close http service: %v", err)
			}
		},
		Bind: []interface{}{
			httpService,
			scriptService,
			collectionsService,
			importService,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
