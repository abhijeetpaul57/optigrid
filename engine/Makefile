CXX      = g++
CXXFLAGS = -std=c++17 -O2 -Wall -Wextra
SRCDIR   = src
BUILDDIR = build
TARGET   = $(BUILDDIR)/optigrid_engine

SRCS = $(SRCDIR)/main.cpp \
       $(SRCDIR)/Graph.cpp \
       $(SRCDIR)/Dijkstra.cpp \
       $(SRCDIR)/Allocator.cpp \
       $(SRCDIR)/Simulator.cpp

all: $(BUILDDIR) $(TARGET)

$(BUILDDIR):
	mkdir -p $(BUILDDIR)

$(TARGET): $(SRCS)
	$(CXX) $(CXXFLAGS) -I$(SRCDIR) -o $(TARGET) $(SRCS)

clean:
	rm -rf $(BUILDDIR)

.PHONY: all clean
