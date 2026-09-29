// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "param-mlx-image-bridge",
    platforms: [.macOS(.v26)],
    products: [
        .executable(name: "param-mlx-inpaint", targets: ["ParamMLXInpaint"]),
        .executable(name: "param-mlx-colorize", targets: ["ParamMLXColorize"]),
    ],
    dependencies: [
        .package(url: "https://github.com/xocialize/mlx-lama-swift", branch: "main"),
        .package(url: "https://github.com/xocialize/mlx-ddcolor-swift", branch: "main"),
    ],
    targets: [
        .executableTarget(
            name: "ParamMLXInpaint",
            dependencies: [
                .product(name: "LaMa", package: "mlx-lama-swift"),
                .product(name: "MIGAN", package: "mlx-lama-swift"),
            ]
        ),
        .executableTarget(
            name: "ParamMLXColorize",
            dependencies: [
                .product(name: "DDColor", package: "mlx-ddcolor-swift"),
            ]
        ),
    ]
)
